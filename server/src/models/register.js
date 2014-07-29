(function (module) {
  'use strict';

  var q = require('q');
  var util = require('util');
  var db = require('./db');
  var dv = require('./datavalidator');
  var nodemailer = require('nodemailer');

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
      name : dv.validateUsername,
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

    return db.executePreparedStatement({
      name : 'Register',
      text : 'select * from create_user($1, $2, $3)' +
        ' as (created boolean, userId integer, hash text, usernameAlreadyExists boolean' + 
        ', emailAlreadyExists boolean)',
      values : [
        userProps.name,
        userProps.password,
        userProps.email
      ]
    })
    // the query has been executed correctly
    .then(function(result){
      var row = result.rows[0];
      
      //Username or email already exists in the database
      if (row.created === false) {
        //row can tell whether the username/email
        //are already taken or not using
        //emailAlreadyExists and usernameAlreadyExists
        //properties
        throw row;	
      }
      //User has been created
      return row;
    });
  };

  Register.prototype.sendActivationEmail = function (username, email, hash) {
    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'levasseur.cl@gmail.com',
        pass: '<_cL1475369!>;'
      }
    });

    // NB! No need to recreate the transporter object. You can use
    // the same transporter object for all e-mails

    // setup e-mail data with unicode symbols
    var mailOptions = {
      from: 'Memorizy', // sender address
      to: email, // list of receivers
      subject: 'Account activation', // Subject line
      text: 'localhost:3000/register/' + hash, // plaintext body
      html: 'localhost:3000/register/' + hash // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        console.log(error);
      }else{
        console.log('Message sent: ' + info.response);
      }
    });
  };

  Register.prototype.activateAccount = function (hash) {
    console.log('activate account ' + hash);
    if (typeof hash !== 'string' || hash.length !== 32) {
      return q.reject('hash must be a string of 32 characters');
    }

    console.log('\texecute statement');
    return db.executePreparedStatement({
      name : 'activateAccount',
      text : 'select enable_account($1)',
      values : [hash]
    });
  };

  module.exports = singleton;
})(module);
