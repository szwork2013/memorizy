var should = require('should');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');
var dv = require('../models/dataValidator');

describe('dataValidator.checkRequired', function(){
	it('should return a rejected promise with an error containing all missing fields if any', function(){
		(function(){
			dv.checkRequired({ v1 : 'a', v2 : 'b', v3 : 'c' },
					 ['v1', 'v2', 'v3', 'v4'])
		}).should.throw();
	});

	it('should return a resolved promise if all fields are supplied', function(){
		(function(){
			dv.checkRequired({ v1 : 'a', v2 : 'b', v3 : 'c', v4 : 'd' }, 
					  ['v1', 'v2', 'v3', 'v4'])
					 .should.not.throw();
		}).should.throw();
	});
});

describe.only('dataValidator.validateEmail', function(){
	it('should return false if email is invalid', function(){
		dv.validateEmail('test');
		dv.validateEmail('test@');
		dv.validateEmail('@test.com');
		dv.validateEmail('abc@.test');
		dv.validateEmail('abc@test.');
		dv.validateEmail(0);
		dv.validateEmail('');
		dv.validateEmail(null);
		dv.validateEmail();
		dv.validateEmail(NaN);
	});

	it('should return true if email is valid', function(){
		dv.validateEmail('test@test.com');
		dv.validateEmail('register@study.com');
		dv.validateEmail('testing@gmail.com');
		dv.validateEmail('register.testing@study.eu');
	});
});

describe('dataValidator.validateUsername', function(){

});

describe('dataValidator.checkPassword', function(){

});
