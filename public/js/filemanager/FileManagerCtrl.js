angular.module('memorizy.filemanager.FileManagerCtrl', [])
.controller('FileManagerCtrl', 
  function ($scope, $http, $location, $routeParams, FileManager) { 

    $scope.refresh = function () {
      console.log('FileManager = ', FileManager);
      FileManager.getAll().success(function (data) {
        // depending on whether $scope.folder or $scope.deck
        // exists, a different partial and another controller
        // will be included, $scope.[folder|deck] will be
        // manipulated by the included controller
        if (data.file.type === 'folder') {
          $scope.folder = data.file;
          $scope.action = $routeParams.action;
        }
        else if (data.file.type === 'deck') {
          $scope.deck = data.file;
          $scope.action = $routeParams.action;
        }
      })
      .error(function (err) {
        throw err;
      });
    };

    $scope.refresh();
  });

