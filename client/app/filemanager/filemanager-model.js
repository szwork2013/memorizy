(function () {
  'use strict';

  function FileManager($location, socket) {
    this.$location = $location;
    this.socket    = socket;

    this.folder = null;
    this.deck   = null;
    this.tree   = null;

    this.validFileName = function (filename) {
      return true; 
    };

    this.nameAlreadyTaken = function (filename) {
      for (var i = 0; i < this.folder.files.length; i++) {
        if (this.folder.files[i].name === filename) {
          return true;
        }
      }

      return false;
    };

    var self = this;

    socket.on('file:folder', function (folder) { self.deck = null; self.folder = folder; });
    socket.on('file:deck',   function (deck)   { self.deck = deck;       });
    socket.on('file:tree',   function (tree)   { self.tree = tree;       });
    socket.on('file:new',    function (file)   { self.folder.files.push(file); });

    this.getIndex = function(fileId) {
      var files = this.folder.files;
      for (var i = 0; i < files.length; i++) {
        if (files[i].id === fileId) {
          return i;
        }
      }

      return -1;
    };

    socket.on('file:copied', function (file)  { 
      if (file.copiedTo === $location.path()) { 
        self.folder.files.push(file); 
      }
    });

    socket.on('file:moved', function (file)  { 
      var files = self.folder.files,
          index;

      if (file.movedTo !== $location.path()) {
        if ((index = self.getIndex.call(self, file.id)) < 0) { return; }
        files.splice(index, 1);
      }
      else if ((index = self.getIndex.call(self, file.id)) < 0) {
        files.push(file);
      }
    });

    socket.on('file:removed', function (fileId)  { 
      var index = self.getIndex.call(self, fileId);

      if (index < 0) { return; }
      self.folder.files.splice(index, 1);
    });

    socket.on('file:renamed', function (file)  { 
      var index = self.getIndex.call(self, file.id);
      if (index < 0) { return; }
      self.folder.files[index].name = file.newName;
    });
  }

  FileManager.prototype.getFile = function () {
    this.socket.emit('file:get', { path: this.$location.path() });
  };

  FileManager.prototype.getFileTree = function () {
    this.socket.emit('file:tree', { path: this.$location.path() });
  };

  FileManager.prototype.addFile = function (file) { 
    if (!file || !this.validFileName(file.name)) {
      throw new Error('Invalid file');
    }
    this.socket.emit('file:new', file); 
  };
  
  FileManager.prototype.renameFile = function (id, newName) {
    var index = this.getIndex(id);
    if (index < 0) { throw new Error('Can\'t find file with id: ' + id); }
    var file = this.folder.files[index];

    if (file.name === newName) {
      return;
    }

    if (!this.validFileName(newName)) {
      throw new Error('Filename is invalid: ', newName);
    }

    if (this.nameAlreadyTaken(newName)) {
      throw new Error('Filename is already taken: ' + newName);
    }

    this.socket.emit('file:rename', {
      id:      file.id,
      newName: newName
    });
  };

  FileManager.prototype.moveFile = function (src, dest) {
    if (dest === this.folder.id) {
      throw new Error('Cannot move to the same folder');
    }

    this.socket.emit('file:move', {
      src:  src,
      dest: dest
    }); 
  };

  FileManager.prototype.copyFile = function (src, dest) {
    if (dest === this.folder.id) {
      throw new Error('Cannot move to the same folder');
    }
    this.socket.emit('file:copy', {
      src:  src,
      dest: dest
    }); 
  };

  FileManager.prototype.removeFile = function (id) { 
    if (this.getIndex(id) < 0) {
      throw new Error('File not found in this folder');
    }

    this.socket.emit('file:remove', id); 
  };

  FileManager.prototype.toggleVisibility = function (file) {
    this.socket.emit('file:toggleVisibility', file.id);
  };

  angular.module('memorizy.filemanager.FileManagerModel', [])
  .service('FileManager', ['$location', 'socketio', FileManager]);

})();

