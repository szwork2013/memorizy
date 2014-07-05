(function (module) {
  'use strict';

  var q = require('q');
  var util = require('util');
  var db = require('./db');
  var dv = require('./datavalidator');

  function Register(){}

  var singleton = new Register();

  /**
   * RegistrationError
   *
   * @param err An object containing information
   * about registration failure
   * @return
   */
  function RegistrationError (err) {
    this.name = 'RegistrationError';
    this.message = 'An error occured during registration';
    this.err = err;
    this.toString = function() {
      return this.name + ': ' +
                 this.message + '\n' + 
                 util.inspect(this.err);
    };
  }

  /**
   * validateRegistrationData makes sure that user information
   * are valid and can be sent to the database server, it does
   * not check whether the username/email already exists or not
   *
   * @param registrationData An object literal which must contain 
   * username, password and email properties
   * @return An object containing missingProperties and 
   * invalidProperties arrays 
   */
  Register.prototype.validateRegistrationData = function(registrationData){
    if (Object.prototype.toString.call(registrationData) !== '[object Object]') {

      throw new Error('registrationData = ' + registrationData + 
              ' (expected an object literal)');	
    }

    return dv.validate(registrationData, {
      username : dv.validateUsername,
      password : dv.validatePassword,
      email : dv.validateEmail
    });
  };

  /**
   * createUser
   *
   * @param userProps An object literal which must contain 
   * username, password and email properties
   * @return A resolved promise if the user is created,
   * a rejected promise containing information about
   * why the query failed otherwise
   */
  Register.prototype.createUser = function(userProps){
    if (Object.prototype.toString.call(userProps) !== '[object Object]') {
      return q.reject('userProps = ' + userProps + 
          ' (expected an object literal)');
    }

    var err = this.validateRegistrationData(userProps);

    if (err.missingProperties.length > 0 || 
          err.invalidProperties.length > 0) {

      return q.reject(new RegistrationError(err));
    }

    var deferred = q.defer();

    db.executePreparedStatement({
      name : 'Register',
      text : 'select * from create_user($1, $2, $3, $4)' +
        ' as (created boolean, usernameAlreadyExists boolean' + 
        ', emailAlreadyExists boolean)',
      values : [
        userProps.username,
        userProps.username, // should fix it
        userProps.password,
        userProps.email
      ]
    })
    // the query has been executed correctly
    .then(function(result){
      var row = result.value.rows[0];
      
      //Username or email already exists in the database
      if (row.created === false) {
        //row can tell whether the username/email
        //are already taken or not using
        //emailAlreadyExists and usernameAlreadyExists
        //properties
        deferred.reject(row);	
      }
      //User has been created
      deferred.resolve(row);
    })
    // the query execution has failed
    .catch(function(err){
      deferred.reject(err);
    });

    return deferred.promise;
  };

  module.exports = singleton;
})(module);
