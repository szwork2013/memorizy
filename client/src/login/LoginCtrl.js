angular.module('memorizy.login.LoginCtrl', [])
.controller('LoginCtrl', [ '$scope', 'LoginModel', function ($scope, LoginModel) {

  $scope.user = {
    name: null,
    password: null
  };

  $scope.login = function () {
    LoginModel.login($scope.user.name, $scope.user.password); 
  };

}]);
