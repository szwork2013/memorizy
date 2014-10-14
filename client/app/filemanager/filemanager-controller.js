(function (angular) {
  'use strict';

  function FileManagerController ($document, $scope, $http, $location, $timeout, 
                                     socket, FileManager, cssInjector) 
  {
      cssInjector.add('/css/filemanager/filemanager.css');

      FileManager.getFile();
      socket.join($location.path);

      $timeout(function() {
        $scope.newFile      = {};
        $scope.newFile.type = 'folder' ;
        $scope.contextMenu  = {
          left:    0,
          top:     0,
          visible: false,
        };
        $scope.selected     = {};
        $scope.renameModal  = { filename: '' };
      });

      $scope.getFolder = function () { 
        return FileManager.folder; 
      };
      $scope.getFolderContent = function () { 
        return FileManager.folder ? FileManager.folder.files : null; 
      };
      $scope.getDeck = function () { 
        console.log('getDeck gonna return ', FileManager.deck);
        return FileManager.deck; 
      };

      $scope.addFile = function () {
        FileManager.addFile($scope.newFile);
        $scope.newFile.name = '';
      };
 
      $scope.renameFile = function (file, newName) {
        FileManager.renameFile(file, newName);
        $scope.renameModal.filename = '';
      };

      $scope.updateFile       = FileManager.updateFile;
      $scope.deleteFile       = FileManager.deleteFile;
      $scope.moveFile         = FileManager.moveFile;
      $scope.copyFile         = FileManager.copyFile;
      $scope.toggleVisibility = FileManager.toggleVisibility;
      $scope.getFileTree      = FileManager.getFileTree;

      $scope.showContextMenu = function (event) {
        // The table contains th tags which should 
        // not display a context menu on right click
        if (event.target.nodeName !== 'TD') { return; }

        //$scope.contextMenu.left = event.pageX;
        //$scope.contextMenu.top = event.pageY;
        //$scope.contextMenu.visible = true;

        var fileIdx = event.target.parentNode.dataset.index;
        var file = $scope.getFolderContent()[fileIdx];
        $scope.selected = file;
        $scope.selected.index = fileIdx;
        $scope.contextMenu.studyUrl = 
          $location.path() + '/' + file.name + '?action=study';
        $scope.contextMenu.editUrl = 
          $location.path() + '/' + file.name + '?action=edit';

        $('#contextMenu').css({
          display: 'block',
          left: event.pageX,
          top: event.pageY
        });
        
        return false;
      };

      $scope.$on('$destroy', function () {
        socket.leave($location.path);
      });

      $document.on('click', function (e) {
        if (e.which === 1) { // left click
          $('#contextMenu').hide();
        }
      });

      //$('body').on('contextmenu', 'table tr', function(e) {
      //});

      //$('#contextMenu').on('click', 'a', function() {
        //console.log('click a');
        //$('#contextMenu').hide();
      //});

  }

  angular.module('memorizy.filemanager.FileManagerController', [])
  .controller('FileManagerController', [
    '$document', 
    '$scope', 
    '$http', 
    '$location', 
    '$timeout', 
    'socket.io', 
    'FileManager', 
    'cssInjector',
    FileManagerController
  ]);

})(angular);
