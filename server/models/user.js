(function (module) {
  'use strict';

  var q = require('q');
  var db = require('./db');

  function User() {}

  User.prototype.getUserById = function (id) {
    if (typeof id !== 'number') {
      return q.reject(new Error('id = ' + id + ' (expected a number)'));
    }

    return db.executePreparedStatement({
      name : 'getUserById',
      text : 'select * from users where id = $1',
      values : [ id ]
    }).then(function (res) {
      if (res.rows.length !== 1) {
        throw new Error('User with id ' + id + ' not found');
      }
      return res.rows[0];
    });
  };

  User.prototype.authenticateUser = function (username, password) {
    if (typeof username !== 'string') {
      return q.reject(new Error('username = ' + username + 
                                ' (expected a string)'));
    }

    if (typeof password !== 'string') {
      return q.reject(new Error('password = ' + password + 
                                ' (expected a string)'));
    }

    return db.executePreparedStatement({
      name : 'authenticateUser',
      text : 'select u.id, u.name from users u where name = $1 ' +
        'and password = $2',
      values : [ username, password ]
    }).then(function (res) {
      if (res.rows.length !== 1) {
        throw new Error('Authentication failed');
      }
      return res.rows[0];
    });
  };

  var singleton = new User();
  module.exports = singleton;
})(module);
