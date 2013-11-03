var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');

describe('register.createUser', function(){ 
	it('should call its callback with an error if there is at least one required user property is missing');

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
