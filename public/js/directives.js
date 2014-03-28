angular.module('memorizy.directives', [])
.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(event) {
      scope.$apply(function() {
        event.preventDefault();
        fn(scope, {$event:event});
      });
    });
  };
})
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
})
.directive('focusOn', function() {
  return function(scope, elem, attr) {
    scope.$on('focusOn', function(e, name) {
      if(name === attr.focusOn) {
        elem[0].focus();
      }
    });
  };
})
.directive('contenteditable', function() {
  return {
    restrict: 'A', // only activate on element attribute
    require: '?ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModel) {
      if(!ngModel) return; // do nothing if no ng-model

      // Specify how UI should be updated
      ngModel.$render = function() {
        element.html(ngModel.$viewValue || '');
      };

      // Listen for change events to enable binding
      element.on('blur keyup change', function() {
        scope.$apply(read);
      });

      // Write data to the model
      function read() {
        var html = element.html();
        // When we clear the content editable the browser leaves a <br> behind
        // If strip-br attribute is provided then we strip this out
        if( attrs.stripBr && html == '<br>' ) {
          html = '';
        }
        ngModel.$setViewValue(html);
      }
    }
  };
});



