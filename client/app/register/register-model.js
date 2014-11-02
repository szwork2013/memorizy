(function () {
  'use strict';

  function RegisterModel ($location, $timeout, socket) {
    this.$location = $location;
    this.$timeout = $timeout;
    this.socket = socket;
  }

  // TODO: Refactoring, maybe putting register/login code into a user module
  RegisterModel.prototype.register = function (pseudo, email, password) {
    var regex = {
      pseudo:   /^.{2,128}$/,
      email:    /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
      password: /^.{6,128}$/
    };

    if (!pseudo.match(regex.pseudo)) {
      throw new Error('Invalid pseudo'); 
    }

    if (!email.match(regex.email)) {
      throw new Error('Invalid email: ' + email); 
    }

    if (!password.match(regex.password)) { 
      throw new Error('Invalid password'); 
    }
    
    this.socket.emit('register:classic', {
      pseudo:   pseudo,
      email:    email,
      password: password
    });
  };

  angular.module('memorizy.register.RegisterModel', [])
  .service('registerModel', [
    '$location',
    '$timeout',
    'socketio',
    RegisterModel
  ]);
})();

