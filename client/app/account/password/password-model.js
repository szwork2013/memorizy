(function () {
  'use strict';

  function PasswordModel ($http) {
    this.$http = $http;
  }

  PasswordModel.prototype.updatePassword = function (oldPassword, newPassword, confirm) {
    return this.$http.post('/api/account/password', {
      oldPassword: oldPassword,
      newPassword: newPassword,
      newPasswordConfirm: confirm
    });
  };

  angular.module('memorizy.account.password.PasswordModel', [])
  .provider('passwordModel', function () {
    this.$get = [
      '$http', 
      function ($http) {
        return new PasswordModel($http);
      }
    ];
  }); 
})();
