/*********************
 * for Webpage
 *********************/
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app)

/*********************
 * Document Model
 *********************/
var docs = (function(changeset) {
  var doc = function() {
    var contents = 'hello world';
    var revisions = [];
    this.apply = function(packed) {
      var change = changeset.unpack(packed);
      revisions.push(change);
      contents = change.apply(contents);

      console.log('apply:[' + change + ']', revisions.length, contents);
    };
    this.code = function() {
      return contents;
    };
  };
  return new doc();
})(require('changesets').Changeset);

/*********************
 * for concurrency
 *********************/
var socketIO = require('socket.io');
var io = socketIO.listen(server);
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  socket.on('message', function (msg) {
    var type = msg.type, data = msg.data;
    if (type === 'operation') {
      docs.apply(data);
      socket.broadcast.json.send({type: 'operation', data: data});
    }
  });

  socket.json.send({type: 'ready', data: {id: socket.id, docs: docs.code()}});
  socket.on('disconnect', function() {
    console.log('disconnect', socket.id);
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function(ex) {
  console.error(ex.stack);
});
