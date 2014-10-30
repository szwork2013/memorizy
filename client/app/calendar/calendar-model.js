(function (angular) {
  'use strict';

  function CalendarModel (socket, $location) {
    this.socket = socket;
    this.$location = $location; 

    var self = this;

    socket.on('calendar:count', function (count) {
      self.count = count;  
    });

    socket.on('calendar:get', function (calendar) {
      self.calendar = calendar;
    });
  }

  CalendarModel.prototype.getCount = function () {
    this.socket.emit('calendar:count');
  };

  CalendarModel.prototype.getCalendar = function () {
    this.socket.emit('calendar:get');
  };

  CalendarModel.prototype.getNextSessionsHeatMap = function (calendar) {
    function millisecondsToSeconds (milliseconds) {
      return milliseconds / 1000;
    }

    var data = {};

    for (var i in calendar) {
      var timestamp = millisecondsToSeconds(new Date(calendar[i].next_session).getTime());
      if (data[timestamp]) {
        data[timestamp] += calendar[i].size;
      }
      else {
        data[timestamp] = calendar[i].size;
      }
    }

    return data;
  };

  angular.module('memorizy.calendar.CalendarModel', []). 
    provider('calendarModel', function () {
      this.$get = [
        'socket.io',
        '$location',
        function (socket, $location) {
          return new CalendarModel(socket, $location);
        }
      ];
    });

})(angular);
