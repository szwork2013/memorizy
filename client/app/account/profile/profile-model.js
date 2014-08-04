(function () {
  'use strict';

  function ProfileModel ($http, $timeout) {
    this.$http = $http;
    this.$timeout = $timeout;
  }

  ProfileModel.prototype.updateProfile = function (profile) {
    return this.$http.put('/api/account/profile', profile);
  };

  angular.module('memorizy.account.profile.ProfileModel', []).
    provider('profileModel', function () {
      this.$get = [
        '$http', 
        '$timeout',
        function ($http, $timeout) {
          return new ProfileModel($http, $timeout);
        }
      ];
    }); 

})();
