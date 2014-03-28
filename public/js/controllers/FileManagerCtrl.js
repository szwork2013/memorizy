angular.module('memorizy.controllers')
.controller('FileManagerCtrl', 
  function ($scope, $http, $location, FileManagerService) { 

    $scope.refresh = function () {
      console.log(JSON.stringify('refresh...'));
      FileManagerService.getAll().success(function (data) {
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

