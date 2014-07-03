(function (module) {
  'use strict';

  var db = require('./db');
  var q = require('q');

  function Finder () {}

  Finder.prototype.find = function (userId, query) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');
    }
    if (typeof query !== 'string') {
      return q.reject('query = ' + query + ' (expected a string)');
    }

    return db.executePreparedStatement({
      name: 'find',
      text: 'select * from find($1::INTEGER, string_to_array($2, \' \'))',
      values: [userId, query]
    }); 
  };

  var singleton = new Finder();
  module.exports = singleton;

})(module);
