angular.module('memorizy.filenavigation.FileNavigationCtrl', [])
.controller('FileNavigationCtrl', 
  function ($document, $scope, $http, $location, FileNavigation) {

    $scope.newFile = {};
    $scope.newFile.parentId = $scope.folder.id;
    $scope.newFile.type = 'folder' ;
    $scope.contextMenu = {
      left: 0,
      top: 0,
      visible: false
    };

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

    $scope.showContextMenu = function (event) {
      // The table contains th tags which should 
      // not display a context menu on right click
      if (event.target.nodeName !== 'TD') { return; }

      //$scope.contextMenu.left = event.pageX;
      //$scope.contextMenu.top = event.pageY;
      //$scope.contextMenu.visible = true;

      var fileIdx = event.target.parentNode.dataset.index;
      $scope.contextMenu.file = $scope.folder.files[fileIdx];
      $scope.contextMenu.file.index = fileIdx;

      console.log('$scope.contextMenu.file = ', $scope.contextMenu.file);


      $('#contextMenu').css({
        display: 'block',
        left: event.pageX,
        top: event.pageY
      });
      
      return false;
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
