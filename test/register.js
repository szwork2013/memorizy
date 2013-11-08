var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');

describe('register.createUser', function(){ 
	var valid = {
		username : 'test',
		password : 'test',
		email : 'test@test.com'
	}
	var invalid = {
		username : 'ab',
		password : 'ab',
		email : 'test'
	}

	it('should throw an IllegalArgumentError if user properties are not an object', function(done){
		var s = [ null, 'abc', 123, []];
		for (var i in s) {
			try { 
				register.createUser(s[i]); 
				throw new Error('should have thrown an IllegalArgumentError');
			} 
			catch(e) { 
				if (e.name != 'IllegalArgumentError') { 
					done(e); 
				}
			}
		}

		done();
	});

	it('should return a rejected promise if at least one required user property is missing, without hitting the database', function(done){
		var err = new Error('should have returned a rejected promise');
		register.createUser({ password: valid.password, email : valid.email }).then(function(){ done(err); }); 
		register.createUser({ username : valid.user, email : valid.email}).then(function(){ done(err); }); 
		register.createUser({ username : valid.user, password : valid.password }).then(function(){ done(err); }); 

		done();
	});

	it('should return a rejected promise if at least one required user property is invalid, without hitting the database', function(done){
		var err = new Error('should have returned a rejected promise');
		register.createUser({ username : invalid.username, password: valid.password, email : valid.email }).then(function(){ done(err); }); 
		register.createUser({ username : valid.user, password : invalid.password, email : valid.email }).then(function(){ done(err); }); 
		register.createUser({ username : valid.user, password : valid.password, email : invalid.email }).then(function(){ done(err); }); 

		done();
	});

	it('should return a resolved promise if all parameters are supplied and valid', function(){
		register.createUser(valid).isFulfilled().should.be.true;
	});

	it('should call its callback with an error if the user cannot be created');

	it('should call its callback without any error if the user has been created successfully');
});

describe('register.sendAccountActivationEmail', function(){
	it('should not send the email if user information are missing');

	it('should call its callback with an error if the email isn\'t sent');

	it('should call its callback with an error if the email cannot be sent');

	it('should call its callback without any error if the user has been created successfully');
});

describe('register.enableAccount', function(){
	it('should call its callback with an error if the account is already enabled');

	it('should call its callback without any error if the account has been enabled successfully');
});
