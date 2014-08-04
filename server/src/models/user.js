(function (module) {
  'use strict';

  var q = require('q');
  var db = require('./db');

  function User() {}

  User.prototype.getUserId = function (req) {
    return req.user.id;
  };

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

  User.prototype.updateProfile = function (userId, user) {
    if (typeof userId !== 'number') {
      return q.reject(new Error('userId must be an number'));
    }
    if (Object.prototype.toString.call(user) !== '[object Object]') {
      return q.reject(new Error('user must be an object'));
    }

    return db.executePreparedStatement({
      name: 'updateUser',
      text: 'select update_profile($1::integer, $2::json)',
      values: [ userId, user ]
    });
  };

  User.prototype.updatePassword = function (userId, oldPassword, newPassword, 
                                            newPasswordConfirm) 
  {
    if (typeof userId !== 'number') {
      return q.reject(new Error('userId must be an number'));
    }
    if (typeof oldPassword !== 'string') {
      return q.reject(new Error('oldPassword must be an string'));
    }
    if (typeof newPassword !== 'string') {
      return q.reject(new Error('newPassword must be an string'));
    }
    if (typeof newPasswordConfirm !== 'string') {
      return q.reject(new Error('newPasswordConfirm must be an string'));
    }

    return db.executePreparedStatement({
      name: 'updateUser',
      text: 'select update_password($1::integer, $2::text, $3::text)',
      values: [ 
        userId,
        oldPassword,
        newPassword
      ]
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
