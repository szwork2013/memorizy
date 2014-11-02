(function () {
  'use strict';
  
  angular.module('memorizy.socketio', []).factory('socketio', ['$timeout', function ($timeout) {
    var socket = io(),
        on     = socket.on;

    socket.on = function (eventName, callback) {
      on.call(socket, eventName, function(data) {
        $timeout(function () {
          callback.call(socket, data);
        });
      });
    };

    socket.join = function (room) {
      this.emit('join', room);
    };

    socket.leave = function (room) {
      this.emit('leave', room);
    };

    socket.on('error', function (err) {
      alert(err);
    });

    return socket;

  }]);

})();
  
  
