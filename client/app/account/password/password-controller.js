(function () {
  'use strict';

  function PasswordController ($scope, cssInjector, passwordModel) {
    cssInjector.add('/css/profile/profile.css');
    $scope.updatePassword = passwordModel.updatePassword.bind(passwordModel);
  }

  angular.module('memorizy.account.password.PasswordController', [])
  .controller('passwordController', [
    '$scope',
    'cssInjector',
    'passwordModel',
    PasswordController
  ]);

})();
