(function () {
  'use strict';

  function RegisterController ($scope, registerModel, cssInjector) {
    this.$scope = $scope;

    cssInjector.add('/css/register/register.css');

    $scope.user = {};
    $scope.register = registerModel.register;
  }

  angular.module('memorizy.register.RegisterController', [])
  .controller('registerController', [
    '$scope',
    'registerModel',
    'cssInjector',
    RegisterController
  ]);

})();

