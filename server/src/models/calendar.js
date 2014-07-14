(function () {
  'use strict';

  var db = require('./db');

  function Calendar () {}

  var singleton = new Calendar();

  Calendar.prototype.count = function (userId) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');
    }

    return db.executePreparedStatement({
      name : 'countFlashcardsToStudy',
      text : 'select count_flashcards_to_study($1::INTEGER)',
      values : [userId]
    }). 
    then(function (res) {
      console.log('res = ', res);
      return res.rows[0].count_flashcards_to_study;
    });
  };

  Calendar.prototype.getCalendar = function (userId) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');
    }

    return db.executePreparedStatement({
      name : 'getCalendar',
      text : 'select * from get_calendar($1::INTEGER)',
      values : [userId]
    }). 
      then(function (res) {
      return res.rows;
    });
  };

  module.exports = singleton;
})();
