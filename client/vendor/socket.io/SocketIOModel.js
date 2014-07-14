angular.module('memorizy.socketio', []).
provider('socketio', function () {
  this.$get = function () {
    return io();
  }; 
}).
provider('socketioUploader', function () {
  this.$get = ['socketio', function (socketio) {
    return new SocketIOUploader(socketio);
  }];
});
