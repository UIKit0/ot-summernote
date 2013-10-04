var otsummernote = (function(changesets, io) {
  var changeset = changesets.Changeset;

  var otSummernote = function(opts) {
    // params
    var url = opts.url, hListener = opts.listener, hSender = opts.sender;

    // connect socket
    var socket = io.connect(url);

    var docs, id;
    socket.on('message', function(msg) {
      var type = msg.type, data = msg.data;
      if (type === 'ready') { // document ready
        docs = data.docs;
        id = data.id;
      } else if (type === 'operation') { // operation
        docs = changeset.unpack(data).apply(docs);
      }

      hListener(docs);
    });

    socket.json.send({type: 'login'});

    this.operation = function(code) {
      if (docs !== code) {
        console.log('edit', docs, code);
        var changes = changeset.fromDiff(docs, code);
        socket.json.send({type: 'operation', data: changes.pack()});
        docs = code;
      }
    };
  };

  return {
    create: function (opts) {
      return new otSummernote(opts);
    }
  };
})(changesets, io);
