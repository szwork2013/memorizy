(function () {
  'use strict';

  angular.module('memorizy.filemanager.FileManagerController', [])
  .controller('FileManagerController', 
    function ($scope, $http, $location, $routeParams, FileManager) { 

      $scope.refresh = function () {
        FileManager.getFiles().success(function (files) {
          if (Object.prototype.toString.call(files) === '[object Array]') {
            for (var i in files) {
              if (file[i].type === 'deck') {
                if (typeof $scope.decks === 'undefined') {
                  $scope.decks = [];
                }

                $scope.decks.push(files[i]);
                $scope.action = $routeParams.action;
              }
              else {
                // If there are multiple files, it means we're studying several decks,
                // so there types are always 'deck'
                throw 'invalid file type';
              }
            }
          }
          else if (Object.prototype.toString.call(files) === '[object Object]') {
            if (files.type === 'folder') {
              $scope.folder = files;
              $scope.action = $routeParams.action;
            }
            else if (files.type === 'deck') {
              if (typeof $scope.decks === 'undefined') {
                $scope.decks = [];
              }
              $scope.decks.push(files);
              $scope.action = $routeParams.action;
            }
          }
          else {
            throw 'unknown data type';
          }
        })
        .error(function (err) {
          throw err;
        });
      };

      $scope.refresh();
    });

})();
