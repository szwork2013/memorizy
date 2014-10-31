(function () {
  'use strict';

  function RegisterController ($scope, registerModel, cssInjector) {
    this.$scope = $scope;

    cssInjector.add('/css/register/register.css');

    $scope.user = {};
    $scope.register = function() {
      try {
        registerModel.register;
      } catch(err) {
        $scope.error.register = err;
      }
    };
  }

  angular.module('memorizy.register.RegisterController', [])
  .controller('registerController', [
    '$scope',
    'registerModel',
    'cssInjector',
    RegisterController
  ]);

})();

