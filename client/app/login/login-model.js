(function () {
  'use strict';

  function LoginModel($rootScope, socket, $location, $localStorage) {
    this.$rootScope    = $rootScope;
    this.socket        = socket;
    this.$location     = $location;
    this.$localStorage = $localStorage;

    socket.on('login:loggedIn', function(data) {
      $rootScope.user     = data.user;
      $localStorage.user  = data.user;
      $localStorage.token = data.token;
    });

    socket.on('login:loggedOut', function(data) {
      $rootScope.user     = null;
      $localStorage.user  = null;
      $localStorage.token = null;
    });
  }

  LoginModel.prototype.login = function(username, password) {
    if (!username || !password) {
      throw new Error('username and password cannot be falsy');
    }

    this.socket.emit('login:classic', {
      login:    username,
      password: password
    });
  };

  //LoginModel.prototype.logout = function() {
    //this.$localStorage.$reset();
    //this.$location.path('/');
    //this.$rootScope.user = null;
  //};

  angular.module('memorizy.login.LoginModel', [])
  .service('LoginModel', [
    '$rootScope',
    'socketio',
    '$location',
    '$localStorage',
    LoginModel
  ]);
})();



