angular.module('memorizy.filenavigation.FileNavigationCtrl', [])
.controller('FileNavigationCtrl', 
  function ($document, $scope, $http, $location, FileNavigation) {

    $scope.newFile = {}; 
    $scope.newFile.parentId = $scope.folder.id;
    $scope.newFile.type = 'folder' ;
    $scope.contextMenu = {
      left: 0,
      top: 0,
      visible: false,
    };
    $scope.selected = {};
    $scope.renameModal = {
      filename: ''
    };

    if (!$scope.$$phase) {
      $scope.$apply();
    }

    $scope.addFile = function () {
      FileNavigation.addFile($scope.newFile).success(function (file) {
        $scope.folder.files.push({
          id: file.id,
          ownerId: file.ownerId,
          name: $scope.newFile.name,
          size: 0,
          type: file.type,
          percentage: 0,
          starred: false
        });

        $scope.newFile.name = '';
      });
    };

    $scope.updateFile = function (index, file) {
      FileNavigation.updateFile(file);
      $scope.files[index] = file;
    };

    $scope.deleteFile = function (file) {
      FileNavigation.deleteFile(file);
      $scope.folder.files.splice(file.index, 1);
    };

    $scope.renameFile = function (file, newName) {
      FileNavigation.renameFile(file, newName);
      $scope.selected.name = newName;
      $scope.renameModal.filename = '';
    };

    $scope.moveFile = function (src, dest) {
      FileNavigation.moveFile(src, dest);
    };

    $scope.copyFile = function (src, dest) {
      FileNavigation.copyFile(src, dest).success(function (id) {
        console.log('copy id: ' + id);
      })
      .error(function (err) {
        console.log(err);
      });
    };

    $scope.getFileTree = function () {
      FileNavigation.getFileTree().success(function (tree) {
        console.log('tree = ', tree);
        $scope.tree = tree; 
      })
      .error(function (err) {
        console.log(err); 
      });
    };

    $scope.showContextMenu = function (event) {
      // The table contains th tags which should 
      // not display a context menu on right click
      if (event.target.nodeName !== 'TD') { return; }

      //$scope.contextMenu.left = event.pageX;
      //$scope.contextMenu.top = event.pageY;
      //$scope.contextMenu.visible = true;

      var fileIdx = event.target.parentNode.dataset.index;
      var file = $scope.folder.files[fileIdx];
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

    $scope.studyModes = [
      'Classic',
      'Hardest to easiest',
      'Least studied',
      'Wrongs'
    ];

    $scope.stringifyStudyMode = function (studyModeId) {
      return $scope.studyModes[studyModeId - 1];
    };

    $document.on('click', function () {
      $('#contextMenu').hide();
    });

    //$('body').on('contextmenu', 'table tr', function(e) {
    //});

    //$('#contextMenu').on('click', 'a', function() {
      //console.log('click a');
      //$('#contextMenu').hide();
    //});

  });
