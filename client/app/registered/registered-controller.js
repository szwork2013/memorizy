(function () { 
  'use strict';
  
  function RegisteredController ($scope, $location) {
    $scope.$on('$routeChangeSuccess', function () {
      $scope.email = $location.search().email;
    });
  }

  angular.module('memorizy.registered.RegisteredController', [])
  .controller('registeredController', [
    '$scope',
    '$location',
    RegisteredController
  ]);

})();
