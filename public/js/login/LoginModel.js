angular.module('memorizy.login.LoginModel', [])
.provider('LoginModel', function () {
  this.$get = ['$rootScope', '$http', '$location', '$localStorage',
    function ($rootScope, $http, $location, $localStorage) {
      return {
        login: function (username, password) {
          return $http.post('/login', { 
            username: username,
            password: password
          })
          .success(function (data) {
            $rootScope.user = data.user; 
            $localStorage.user = data.user;
            $localStorage.token = data.token;
          });
        },

        logout: function () {
          $localStorage.$reset();
          $location.path('/');
          $rootScope.user = null;
        }
      };
  }];
});



