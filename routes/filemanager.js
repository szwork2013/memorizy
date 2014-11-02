(function (module) {
  'use strict';

  var fileManager = require('../models/filemanager'),
      deckModel = require('../models/deck'),
      auth = require('../middlewares/auth');

  module.exports = function (socket) {
    socket.on('file:get', function (data) {
      var path = data.path;

      fileManager.getFiles(1, path).then(function (files) {
        if (files[0].type === 'folder') { socket.emit('file:folder', files[0]); }
        else                            { socket.emit('file:deck', files[0]); }
      })
      .catch(function (err) {
        socket.emit('file:error');
      })
      .done();
    });

    socket.on('file:tree', function (socket) {
      fileManager.getFileTree(1).then(function (tree) {
        socket.emit('file:tree', tree);
      })
      .catch(function (err) {
        socket.emit('file:error', err);
      });
    });

    socket.on('file:new', function (file) {
      fileManager.createFile(file).then(function (file) {
        socket.emit('file:new', [file]);
      }).catch(function(err){
        socket.emit('file:error', err);
      }).done();
    });

    socket.on('file:toggleVisibility', function (req) {
      var file = req.file,
          parsed;

      if (typeof file.id === 'string') {
        parsed = parseInt(fileId , 10);
        if (parsed) { fileId = parsed; } 
      }

      fileManager.toggleVisibility(1, fileId).then(function (file) {
        socket.emit('file:toggleVisibility', file); 
      }).catch(function(err){
        socket.emit('file:error', err);
      }).done();
    });

    socket.on('file:move', function (req) {
      fileManager.moveFile(1, req.src, req.dest).then(function (file) {
        socket.emit('file:moved', file);
      })
      .catch(function (err) {
        socket.emit('file:error', err);
      });

    });

    socket.on('file:copy', function (req) {
      fileManager.copyFile(1, req.file.path, req.copyTo).then(function (file) {
        socket.emit('file:copied', file);
      })
      .catch(function (err) {
        socket.emit('file:error', err);
      });

    });

    socket.on('file:rename', function (req) {
      fileManager.renameFile(1, req.fileId, req.newName).then(function () {
        socket.emit('file:renamed', file);
      }).catch(function (err) {
        socket.emit('file:error', err);
      });
    });

    socket.on('file:remove', function (req) {
      fileManager.deleteFile(1, parseInt(req.fileId)).then(function (fileId) {
        socket.emit('file:removed', { fileId: fileId });
      }).catch(function(err){
        socket.emit('file:error', err);
      }).done();
    });
  };
})(module);
