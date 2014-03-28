angular.module('memorizy.services')
.factory('focus', function ($rootScope, $timeout) {
  return function(name) {
    console.log('service focus to ' + name);
    $timeout(function (){
      $rootScope.$broadcast('focusOn', name);
    });
  };
});


