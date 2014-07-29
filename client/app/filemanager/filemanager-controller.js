(function () {
  'use strict';

  angular.module('memorizy.filemanager.FileManagerController', [])
  .controller('FileManagerController', 
    function ($scope, $http, $location, $routeParams, FileManager) { 

      $scope.refresh = function () {
        FileManager.getFiles().success(function (files) {
          console.log('files = ', files);
          for (var i in files) {
            console.log(files[i]);
            if (files[i].type === 'deck') {
              if (typeof $scope.decks === 'undefined') {
                $scope.decks = [];
              }

              $scope.decks.push(files[i]);
              $scope.action = $routeParams.action;
            }
            else if (files[i].type === 'folder') {
              $scope.folder = files[i];
              $scope.action = $routeParams.action;
            }
            else { throw 'invalid file type'; }
          }
        })
        .error(function (err) {
          throw err;
        });
      };

      $scope.refresh();
    });

})();
