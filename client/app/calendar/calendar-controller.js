(function (angular) {
  'use strict';

  function CalendarController ($scope, $location, CalendarModel, 
                               FileManager, cssInjector) 
  {
    cssInjector.add('/css/calendar/calendar.css');

    this.$scope    = $scope;
    this.$location = $location;

    CalendarModel.getCalendar().success(function (calendar) {
      $scope.calendar = calendar;
      updateWeek();
      updateCalHeatMap();

      $scope.calHeatMapConfig = {
         domain: 'month',
         data: toCalHeatMap(calendar),
         subDomainTextFormat: '%d',
         cellSize: 15,
         itemName: 'flashcard',
         legend: [20, 50, 100, 200]
      };
    });

    function toCalHeatMap (calendar) {
      var data = {};

      for (var i in calendar) {
        var timestamp = new Date(calendar[i].next_session).getTime() / 1000;
        if (data[timestamp]) {
          data[timestamp] += calendar[i].size;
        }
        else {
          data[timestamp] = calendar[i].size;
        }
      }

      return data;
    }

    $scope.getDate = function (offset) {
      var res = new Date();
      res.setDate(res.getDate() + offset);

      var day = res.getDay(),
          dom = res.getDate(),
          month = res.getMonth() + 1,
          year = String(1900 + res.getYear()).substr(2);

      switch (day) {
        case 0: day = 'Sun.'; break;
        case 1: day = 'Mon.'; break;
        case 2: day = 'Tue.'; break;
        case 3: day = 'Wed.'; break;
        case 4: day = 'Thu.'; break;
        case 5: day = 'Fri.'; break;
        case 6: day = 'Sat.'; break;
        default:
          console.log('error: unknown day');
          return 'undefined';
      }

      if (month < 10) { month = '0' + month; }
      if (dom < 10) { dom = '0' + dom; }

      return day + ' ' + month + '/' + dom;
    };

    function updateWeek () {
      $scope.week = $scope.week || [];
      var calendar = $scope.calendar;

      for (var i = 0; i < 7; i++) {
        var d = new Date();
        d.setDate(d.getDate() + i);
        $scope.week[i] = $scope.week[i] || [];
        var day = new Date(1900 + d.getYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        for (var j = 0; j < calendar.length; j++) {
          var ns = new Date(calendar[j].next_session);
          
          if (sameDay(ns, day)) {
            $scope.week[i].push(calendar[j]);
          }
        }
      }  

      console.log('week = ', $scope.week);
    }

    function updateCalHeatMap () {
      $scope.calHeatMap = $scope.calHeatMap || {};
      var calendar = $scope.calendar;
      var chm = $scope.calHeatMap;

      for (var j = 0; j < calendar.length; j++) {
        var ns = new Date(calendar[j].next_session);
        var timestamp = ns.getTime();

        if (chm[timestamp]) {
          chm[timestamp] += calendar[j].size;
        }
        else {
          chm[timestamp] = calendar[j].size;
        }

      }

    }

    function sameDay (d1, d2) {
      return d1.getYear() === d2.getYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    }

    $scope.studyFiles = function (files) {
      var ids = [];

      for (var i in files) {
        ids.push(files[i].file_id);
      }

      FileManager.getFiles(ids).success(function (data) {
        $scope.decks = data;
      }). 
      error(function (err) {
        console.log(err);
      }); 
    };
  }

  angular.module('memorizy.calendar.CalendarController', []).
    controller('CalendarController',  [
      '$scope',
      '$location',
      'CalendarModel', 
      'FileManager',
      'cssInjector',
      CalendarController
    ]);

})(angular);
