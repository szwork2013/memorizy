(function () {
  'use strict';

  function PathController ($rootScope, $scope, $location) {
    $rootScope.$on('$locationChangeSuccess', function () {
      var tmp = $location.path().split('/'); 
      var path = '';

      $scope.paths = [];
      for (var i = 1; i < tmp.length; i++) {
        path += '/' + tmp[i];
        $scope.paths.push({
          filename: tmp[i],
          path: path
        });
      }
    });
  }

  angular.module('memorizy.path.PathController', []).
   controller('PathController', [
    '$rootScope',
    '$scope',
    '$location',
    PathController
  ]);

})();
