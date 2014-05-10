(function () {
  'use strict';
  function CalendarModel ($http, $location) {
    this.getCalendar = function () {
      return $http.get('/api' + $location.path(), {
        params: { action: 'getCalendar' }
      });
    };
  }

  angular.module('memorizy.calendar.CalendarModel', []). 
    provider('CalendarModel', function () {
      this.$get = [
        '$http',
        '$location',
        function ($http, $location) {
          return new CalendarModel($http, $location);
        }
      ];
    });
})();
