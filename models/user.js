var q = require('q');
var db = require('./db');

function User() {}

var singleton = new User();

User.prototype.getUserById = function (id) {
	if (typeof id !== 'number') {
		return q.reject(new Error('id = ' + id + ' (expected a number)'));
    }

    return db.executePreparedStatement({
        name : 'getUserById',
        text : 'select * from Users where id = $1',
        values : [ id ]
    }).then(function (res) {
        if (res.rows.length !== 1) {
            throw new Error('User with id ' + id + ' not found');
        }
        return res.rows[0];
    });
};

User.prototype.authenticateUser = function (Username, password) {
    if (typeof Username !== 'string') {
        return q.reject(new Error('Username = ' + Username + 
                                  ' (expected a string)'));
    }

    if (typeof password !== 'string') {
        return q.reject(new Error('password = ' + password + 
                                  ' (expected a string)'));
    }

    return db.executePreparedStatement({
        name : 'authenticateUser',
        text : 'select * from Users where Username = $1 ' +
               'and password = $2',
        values : [ Username, password ]
    }).then(function (res) {
        if (res.rows.length !== 1) {
            throw new Error('Authentication failed');
        }
        return res.rows[0];
    });
};

module.exports = singleton;
