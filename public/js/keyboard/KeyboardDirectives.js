angular.module('memorizy.keyboard.KeyboardDirectives', [])
.directive('ngTab', function ($timeout, $parse) {
  return function (scope, element, attrs) {
    element.bind('keydown', function (event) {
      if (event.keyCode === 9 && !event.shiftKey) { // press tab
        event.preventDefault();
        $parse(attrs.ngTab)(scope, {$event:event});
        return false;
      }
    });
  };
})
.directive('ngShiftTab', function ($timeout, $parse) {
  return function (scope, element, attrs) {
    element.bind('keydown', function (event) {
      if (event.keyCode === 9 && event.shiftKey) { // press shift+tab
        event.preventDefault();
        $parse(attrs.ngShiftTab)(scope, {$event:event});
        return false;
      }
    });
  };
});

