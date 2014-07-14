angular.module('memorizy.navbar', []).
  controller('NavbarController', [ 
    '$scope',
    'LoginModel',
    function ($scope, LoginModel) {
      $scope.loginModel = LoginModel;
    }
  ]);
