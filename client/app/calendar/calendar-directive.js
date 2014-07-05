(function (angular) {
  'use strict';

  angular.module('memorizy.calendar.CalendarDirectives', []). 
    directive('calHeatMap', function () {
      return {
        restrict: 'E',
        scope: {
          config: '='
        },
        link: function (scope, element, attrs) {
          scope.$watch('config', function (n, o) {
            if (!n) { return; }

            var cal = new CalHeatMap(),
                config = n;

            cal.init(config);
          });
        }
      };
    });

})(angular);
