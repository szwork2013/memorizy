angular.module('memorizy.filemanager.FileManagerCtrl', [])
.controller('FileManagerCtrl', 
  function ($scope, $http, $location, FileManager) { 

    $scope.refresh = function () {
      console.log('FileManager = ', FileManager);
      FileManager.getAll().success(function (data) {
        console.log('got data:', data);
        // depending on whether $scope.folder or $scope.deck
        // exists, a different partial and another controller
        // will be included, $scope.[folder|deck] will be
        // manipulated by the included controller
        if (data.type === 'folder') {
          $scope.folder = data;
        }
        else if (data.type === 'deck') {
          $scope.deck = data;
        }
      })
      .error(function (err) {
        throw err;
      });
    };

    $scope.refresh();
  });

