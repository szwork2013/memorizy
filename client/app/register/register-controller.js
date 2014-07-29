(function () {
  'use strict';

  function RegisterController ($scope, $location, $timeout, $http, cssInjector) {
    this.$scope = $scope;
    this.$location = $location;
    this.$timeout = $timeout;
    this.$http = $http;

    cssInjector.add('/css/register/register.css');

    $scope.user = {};

    $scope.register = this.register.bind(this);
  }

  RegisterController.prototype.register = function (user) {
    var that = this;

    console.log('send ', user);
    this.$http.post('/register', user).success(function () {
      console.log('successS');
      that.$timeout(function () {
        that.$location.url('/registered?email=' + user.email);
      });
    }).error(function (err) {
      console.log('err: ', err);
    });
  };

  angular.module('memorizy.register.RegisterController', [])
  .controller('registerController', [
    '$scope',
    '$location',
    '$timeout',
    '$http',
    'cssInjector',
    RegisterController
  ]);

})();

