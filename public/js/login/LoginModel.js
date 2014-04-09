angular.module('memorizy.login.LoginModel', [])
.provider('LoginModel', function () {
  this.$get = ['$rootScope', '$window', '$http', '$location', 
    function ($rootScope, $window, $http, $location) {
      return {
        login: function (username, password) {
          return $http.post('/login', { 
            username: username,
            password: password
          }).success(function (data) {
            console.log('data received: ', data);
            $rootScope.user = data.user; 
            $window.sessionStorage.token = data.token;
          })
          .error(function (err, status, headers, config) {
            delete $window.sessionStorage.token; 
          });
        }
      };
  }];
});



