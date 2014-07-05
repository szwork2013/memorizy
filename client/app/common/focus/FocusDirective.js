angular.module('memorizy.focus.FocusOn', [])
.directive('focusOn', function() {
  return function(scope, elem, attr) {
    scope.$on('focusOn', function(e, name) {
      if(name === attr.focusOn) {
        setTimeout(function () {
          console.log(elem[0].focus());
        }, 0);
      }
    });
  };
});

