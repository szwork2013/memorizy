(function () {
  'use strict';

  function ProfileController ($scope, profileModel, cssInjector) {
    cssInjector.add('/css/profile/profile.css');

    $scope.updateProfile = profileModel.updateProfile.bind(profileModel);
  }

  angular.module('memorizy.account.profile.ProfileController', [])
  .controller('profileController', [
    '$scope',
    'profileModel',
    'cssInjector',
    ProfileController
  ]);

})();

