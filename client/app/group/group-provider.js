(function () {
  'use strict';
  
  function GroupModel ($http, $location) {
    this.$http = $http; 
    this.$location = $location; 
  }

  GroupModel.prototype.getRequests = function () {
    return this.$http.get('/api' + $location.path(), {
      params: { action: 'getRequests' }
    });
  };

  GroupModel.prototype.getMembers = function () {
    return this.$http.get('/api' + $location.path(), {
      params: { action: 'getMembers' }
    });
  };

  GroupModel.prototype.getNotifications = function () {
    return this.$http.get('/api' + $location.path(), {
      params: { action: 'getNotifications' }
    });
  };

  GroupModel.prototype.invite = function (userId) {
    return this.$http.put('/api' + $location.path(), userId, {
      params: { action: 'invite', userId: userId }
    });
  };

  GroupModel.prototype.kick = function (userId) {
    return this.$http.put('/api' + $location.path(), userId, {
      params: { action: 'kick', userId: userId }
    });
  };

  GroupModel.prototype.setVisibility = function (visibility) {
    return this.$http.put('/api' + $location.path(), visibility, {
      params: { action: 'setVisibility', visibility: visibility }
    });
  };

  angular.module('memorizy.group.GroupModel', [])
  .provider('groupModel', function () {
    this.$get = ['$http', '$location', function ($http, $location) {
      return new GroupModel($http, $location);
    }];
  });
})();

