(function () {
  'use strict';

  function FileManager($location, socket) {
    this.$location = $location;
    this.socket    = socket;

    this.folder = null;
    this.deck   = null;
    this.tree   = null;

    var self = this;

    socket.on('file:folder', function (folder) { self.deck = null; self.folder = folder; });
    socket.on('file:deck',   function (deck)   { self.deck = deck;       });
    socket.on('file:tree',   function (tree)   { self.tree = tree;       });
    socket.on('file:new',    function (file)   { self.folder.push(file); });

    function getIndex (fileId) {
      var files = this.folder.files;
      for (var i = 0; i < files.length; i++) {
        if (files[i].id === fileId) {
          return i;
        }
      }

      return -1;
    }

    socket.on('file:updated', function (file)  { 
      var files = self.folder.files, index;

      if ((index = getIndex(file.id)) < 0) { return; }
      files[index] = file; 
    });

    socket.on('file:copied', function (file)  { 
      if (file.copiedTo === $location.path()) { 
        self.folder.files.push(file); 
      }
    });

    socket.on('file:moved', function (file)  { 
      var files = self.folder.files;
      if (file.movedFrom === $location.path()) {
        var index;
        if ((index = getIndex(file.id)) < 0) { return; }
        files.slice(index, 1);
      }
      else if (file.movedTo === $location.path()) {
        files.push(file);
      }
    });

    socket.on('file:removed', function (fileId)  { 
      var index = getIndex(fileId);

      if (index < 0) { return; }
      self.folder.files[index].slice(index, 1);
    });

    socket.on('file:renamed', function (file)  { 
      var index = getIndex(fileId);
      if (index < 0) { return; }
      self.folder.files[index].name = file.name;
    });
  }

  FileManager.prototype.getFile = function () {
    this.socket.emit('file:get', { path: this.$location.path() });
  };

  FileManager.prototype.getFileTree = function () {
    this.socket.emit('file:tree', { path: this.$location.path() });
  };

  FileManager.prototype.addFile = function (file) { this.socket.emit('file:new', file); };
  
  FileManager.prototype.updateFile = function (file) { this.socket.emit('file:update', file); };

  FileManager.prototype.renameFile = function (file, newName) {
    this.socket.emit('file:rename', {
      fileId:  file.id,
      newName: newName
    });
  };

  FileManager.prototype.moveFile = function (src, dest) {
    this.socket.emit('file:move', {
      src:  src,
      dest: dest
    }); 
  };

  FileManager.prototype.copyFile = function (src, dest) {
    this.socket.emit('file:copy', {
      src:  src,
      dest: dest
    }); 
  };

  FileManager.prototype.deleteFile = function (file) { this.socket.emit('file:remove', file.id); };

  FileManager.prototype.toggleVisibility = function (file) {
    this.socket.emit('file:toggleVisibility', file.id);
  };

  angular.module('memorizy.filemanager.FileManagerModel', [])
  .service('FileManager', ['$location', 'socket.io', FileManager]);

})();

