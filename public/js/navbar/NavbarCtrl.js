angular.module('memorizy.navbar', []).
  controller('NavbarCtrl', [ 
    '$scope',
    'LoginModel',
    function ($scope, LoginModel) {
      $scope.loginModel = LoginModel;
    }
  ]);
