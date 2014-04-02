angular.module('memorizy.filenavigation.FileNavigationCtrl', [])
.controller('FileNavigationCtrl', 
  function ($scope, $http, $location, FileNavigation) {

    $scope.newFile = {};
    $scope.newFile.parentId = $scope.folder.id;
    $scope.newFile.type = 'folder' ;

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

    $scope.removeFile = function (index) {
      FileNavigation.removeFile($scope.folder.files[index]);
      $scope.folder.files.splice(index, 1);
    };

  });
