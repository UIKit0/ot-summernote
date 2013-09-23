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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*********************
 * for Cuncurrent
 *********************/
var changeset = require('changesets').Changeset
var socketio = require('socket.io');
var redis = require('redis');

var io = socketio.listen(app.listen(3001));
var store = redis.createClient();
var pub = redis.createClient();
var sub = redis.createClient();

io.sockets.on('connection', function (socket) {
  sub.subscribe('editing');
  sub.on('message', function (channel, message) {
    socket.send(message);
  });

  socket.on('message', function (msg) {
    if (msg.type === "edit") {
      pub.publish("editing", msg.message);
    } else if (msg.type === "login") {
      pub.publish('editing', 'A new user in connected:' + msg.user);
      store.sadd('login', msg.user);
    }
  });
  socket.on('disconnect', function() {
    sub.quit();
    pub.publish('editing', 'user is disconnected:' + socket.id);
  });
});
