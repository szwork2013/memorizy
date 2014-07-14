(function (angular) {
  'use strict';

  function CalendarModel ($http, $location) {
    this.$http = $http;
    this.$location = $location; 
  }

  CalendarModel.prototype.count = function () {
    return this.$http.get('/api/calendar', {
      params: { action: 'count' }
    });
  };

  CalendarModel.prototype.getCalendar = function () {
    return this.$http.get('/api' + this.$location.path(), {
      params: { action: 'getCalendar' }
    });
  };

  angular.module('memorizy.calendar.CalendarModel', []). 
    provider('calendarModel', function () {
      this.$get = [
        '$http',
        '$location',
        function ($http, $location) {
          return new CalendarModel($http, $location);
        }
      ];
    });

})(angular);
