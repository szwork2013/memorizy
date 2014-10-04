angular.module('memorizy.login.LoginController', [])
.controller('LoginController', [ '$scope', 'LoginModel', function ($scope, LoginModel) {

  $scope.user = {
    name: null,
    password: null
  };

  $scope.login = function () {
    LoginModel.login($scope.user.name, $scope.user.password); 
  };

}]);
