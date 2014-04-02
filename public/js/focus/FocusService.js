angular.module('memorizy.focus.FocusService', [])
.service('focusService', function ($rootScope, $timeout) {
  this.focus = function(name) {
    console.log('service focus to ' + name);
    $timeout(function (){
      $rootScope.$broadcast('focusOn', name);
    });
  };
});


