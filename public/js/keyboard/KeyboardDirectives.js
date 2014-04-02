angular.module('memorizy.keyboard.KeyboardDirectives', [])
.directive('ngTab', function ($parse) {
  return function (scope, element, attrs) {
    element.bind('keydown', function (event) {
      if (event.keyCode === 9 && !event.shiftKey) { // press tab
        scope.$apply(function() {
          event.preventDefault();
          $parse(attrs.ngTab)(scope, {$event:event});
        });
      }
    });
  };
})
.directive('ngShiftTab', function ($parse) {
  return function (scope, element, attrs) {
    element.bind('keydown', function (event) {
      if (event.keyCode === 9 && event.shiftKey) { // press shift+tab
        scope.$apply(function() {
          event.preventDefault();
          $parse(attrs.ngShiftTab)(scope, {$event:event});
        });
      }
    });
  };
});

