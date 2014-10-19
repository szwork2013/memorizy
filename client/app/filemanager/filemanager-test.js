(function () { 
  'use strict'; 

  describe('filemanager', function () {
    var socket   = inject('socketio'),
        location = inject('$location'),
        sandbox  = sinon.sandbox.create();
    
    socket.emit = function(event, data) {};
    socket.on = function(event, cb) {
      this.listeners = this.listeners || {};
      this.listeners[event] = this.listeners.event || [];

      this.listeners[event].push(cb);
    };

    socket.fire = function(event, data) {
      if (!this.listeners || !this.listeners[event]) { return; }
      this.listeners[event].forEach(function(cb) {
        cb(data);
      });
    };

    location.path = function () {
      return 'here';
    };

    beforeEach(function () {
      module('memorizy');

      module(function ($provide) {
        $provide.value('socketio', socket);
      });

      sandbox.restore();
    });

    describe('filemanager-model', function () {
      var fileManagerModel, args;

      beforeEach(inject(function(FileManager, $location) {
        fileManagerModel = FileManager;
        location = $location;
      }));

      describe('Get existing files', function () {
        it('should emit an event file:get to get files', function() {
          sandbox.spy(socket, 'emit');  
          sandbox.stub(location, 'path', function() {
            return 'here';
          });

          fileManagerModel.getFile();
          sinon.assert.calledWith(socket.emit, 'file:get', sinon.match({
            path: location.path()
          }));
        });
        
        it('should set folder property on event file:folder', function () {
          socket.fire('file:folder', 'test');
          expect(fileManagerModel.folder).to.equal('test');
        });

        it('should set deck property to null on event file:folder', function () {
          fileManagerModel.deck = 'abc';
          expect(fileManagerModel.deck).to.equal('abc');
          socket.fire('file:folder', 'test');
          expect(fileManagerModel.deck).to.equal(null);
        });

        it('should set deck property on event file:deck', function () {
          socket.fire('file:deck', 'test');
          expect(fileManagerModel.deck).to.equal('test');
        });

        it('should set tree property on event file:tree', function () {
          socket.fire('file:tree', 'tree');
          expect(fileManagerModel.tree).to.equal('tree');
        });
      });

      describe('Add a new file', function () {
        it('should emit an event file:new to add a file', function() {
          var file = { name: 'test', type: 'folder' };
          sandbox.spy(socket, 'emit');
          fileManagerModel.addFile(file);
          sinon.assert.calledWith(socket.emit, 'file:new', sinon.match(file));
        });

        it('should update folder content on event file:new', function () {
          fileManagerModel.folder = { files: [] };
          socket.fire('file:new', 'newFile');
          expect(fileManagerModel.folder.files.indexOf('newFile')).not.to.equal(-1);
        });

        it('should throw when trying to add a file with an invalid name', function() {
          var file = { id: 123, name: 'abcd' };
          fileManagerModel.folder = { 
            id: 1,
            files: [file]
          };

          sandbox.stub(fileManagerModel, 'validFileName', function() {
            return false;
          });

          expect(function() {
            fileManagerModel.addFile(file);
          }).to.throw();

          sinon.assert.calledWith(fileManagerModel.validFileName, file.name);
        });

        it('should throw when trying to add a file with a name already taken', function() {
          var files = [
            { id: 123, name: 'abcd' },
            { id: 456, name: 'efgh' }
          ];

          fileManagerModel.folder = { 
            id: 1,
            files: files
          };
          
          sandbox.spy(fileManagerModel, 'addFile');

        });
      });

      describe('Remove a file', function () {
        it('should emit an event file:remove to remove a file', function() {
          fileManagerModel.folder = { files: [{id: 123}] };
          sandbox.spy(socket, 'emit');
          fileManagerModel.removeFile(123);
          sinon.assert.calledWith(socket.emit, 'file:remove', 123);
        });

        it('should throw when trying to remove a file that isn\'t in the opened folder',
          function() {
            sandbox.spy(socket, 'emit'); 
            fileManagerModel.folder = { files: [] };

            expect(function() {
              fileManagerModel.removeFile(123);
            }).to.throw();

            sinon.assert.notCalled(socket.emit);
          }
        );

        it('should update folder content on event file:removed', function () {
          fileManagerModel.folder = { files: [{id: 123}] };
          expect(fileManagerModel.folder.files.length).to.equal(1);
          socket.fire('file:removed', 123);
          expect(fileManagerModel.folder.files.length).to.equal(0);
        });
      }); 

      describe('Rename a file', function () {
        it('should emit an event file:rename to rename a file', function () {
          var fileToRename = { id: 123, name: 'test' };
          fileManagerModel.folder = {
            files: [fileToRename]
          };

          sandbox.spy(socket, 'emit');
          fileManagerModel.renameFile(fileToRename.id, 'another name');
          sinon.assert.calledWith(socket.emit, 'file:rename', sinon.match({
            id: fileToRename.id,
            newName: 'another name'
          }));
        });

        it('should update folder content when a file is renamed', function() {
          fileManagerModel.folder = { files: [{
            id: 123,
            name: 'oldName'
          }]};

          socket.fire('file:renamed', {
            id: 123,
            newName: 'newName'
          });
            
          expect(fileManagerModel.folder.files[0].name).to.equal('newName');
        });

        it('should not send a request when renaming a file to the same name', function() {
          var file = { id: 123, name: 'sameName' };
          fileManagerModel.folder = { 
            id: 1,
            files: [file]
          };

          sandbox.spy(socket, 'emit');
          fileManagerModel.renameFile(file.id, 'sameName');
          sinon.assert.notCalled(socket.emit);
        });

        it('should throw when renaming a file to an invalid name', function() {
          var file = { id: 123, name: 'abcd' };
          fileManagerModel.folder = { 
            id: 1,
            files: [file]
          };

          sandbox.spy(socket, 'emit');
          sandbox.stub(fileManagerModel, 'validFileName', function() {
            return false;
          });

          expect(function() {
            fileManagerModel.renameFile(file.id, 'another name');
          }).to.throw();

          sinon.assert.calledWith(fileManagerModel.validFileName, 'another name');
          sinon.assert.notCalled(socket.emit);
        });

        it('should throw when trying to rename a file to a name already taken', function() {
          var files = [
            { id: 123, name: 'abcd' },
            { id: 456, name: 'efgh' }
          ];

          fileManagerModel.folder = { 
            id: 1,
            files: files
          };
          
          expect(function() {
            fileManagerModel.renameFile(123, 'efgh');
          }).to.throw();
        });

      });

      describe('Move a file', function () {
        it('should emit an event file:move to move a file', function() {
          var fileToMove = { id: 123 },
              dest       = { id: 456 };

          fileManagerModel.folder = { files: [fileToMove] };
          sandbox.spy(socket, 'emit');
          fileManagerModel.moveFile(fileToMove.id, dest.id);
          sinon.assert.calledWith(socket.emit, 'file:move', sinon.match({
            src:  fileToMove.id,
            dest: dest.id
          }));
        });

        it('should update folder content when a file is moved somewhere else', function() {
          fileManagerModel.folder = {
            files: [{ id: 1}]
          };

          expect(fileManagerModel.folder.files.length).to.equal(1);

          socket.fire('file:moved', {
            id: 1,
            movedTo: 'somewhere else'
          });

          expect(fileManagerModel.folder.files.length).to.equal(0);
        });

        it('should update folder content when a file is moved to it', function() {
          fileManagerModel.folder = {
            files: [{ id: 1}]
          };

          expect(fileManagerModel.folder.files.length).to.equal(1);

          socket.fire('file:moved', {
            id: 2,
            movedTo: location.path()
          });

          expect(fileManagerModel.folder.files.length).to.equal(2);
        });

        it('should prevent from moving a file to the same folder', function() {
          fileManagerModel.folder = { 
            id: 1,
            files: [{
              id: 123,
            }]
          };

          expect(function () {
            fileManagerModel.moveFile(123, 1);
          }).to.throw();
        });
      });

      describe('Copy a file', function () {
        it('should emit an event file:copy to copy a file', function() {
          var fileToCopy = { id: 123 };
          var dest       = { id: 456 };

          fileManagerModel.folder = { files: [fileToCopy] };
          sandbox.spy(socket, 'emit');
          fileManagerModel.copyFile(fileToCopy.id, dest.id);
          sinon.assert.calledWith(socket.emit, 'file:copy', sinon.match({
            src:  fileToCopy.id,
            dest: dest.id
          }));
        });

        it('should update folder content when a file is copied to it', function() {
          fileManagerModel.folder = { files: [] };
          var copy = { 
            id:       123,
            name:     'copy',
            copiedTo: location.path()
          };

          socket.fire('file:copied', copy);
          expect(fileManagerModel.folder.files[0]).to.equal(copy);
        });

        it('should throw when trying to copy a file to the same folder', function() {
          fileManagerModel.folder = { 
            id: 1,
            files: [{
              id: 123,
            }]
          };

          expect(function () {
            fileManagerModel.copyFile(123, 1);
          }).to.throw();
        });
      });
    });

    //describe('filemanager-controller', function () {
      //var args;

      //beforeEach(inject(function($document, $rootScope, $location, $controller,
                                //$timeout, socketio, FileManager, cssInjector)
      //{
        //args = {
          //$document:   $document,
          //$scope:      $rootScope.$new(),
          //$location:   $location,
          //$timeout:    $timeout,
          //socketio:    socketio,
          //FileManager: FileManager,
          //cssInjector: cssInjector
        //};

        //fileManagerController = $controller('FileManagerController', args);
      //}));

      //describe('filemanager-controller: $scope.getFolderContent()', function () {
        //it('should return null if FileManager.folder is null', function () {
          ////args.$scope.getFolderContent().should.equal(null); 
        //});
      //});
    //});
  });
})();
