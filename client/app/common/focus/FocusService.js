angular.module('memorizy.focus.FocusService', [])
.service('focusService', function ($rootScope, $timeout) {
  this.focus = function(name) {
    $timeout(function (){
      $rootScope.$broadcast('focusOn', name);
    });
  };
});


