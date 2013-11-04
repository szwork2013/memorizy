var should = require('should');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');
var dv = require('../models/dataValidator');

describe('dataValidator.validate', function(){
	it('should return an error containing all missing/invalid fields if any', function(){
		var err = dv.validate({
			propA : 'valueA',
			propB : 'valueB',
			propC : 'valueC'
		}, {
			propA : function(){ return true; },
			propB : function(){ return false; },
			propC : null,
			propD : null
		});

		err.should.eql({
			missingProperties : ['propD'],
			invalidProperties : ['propB']
		});
	});

	it('should throw an error if a property is present and has a validator which isn\'t a boolean function or null', function(){
		(function(){
			dv.validate({
				prop : 'value'
			}, {
				prop : function(){ return 1; }
			});
		}).should.throw();

		(function(){
			dv.validate({
				prop : 'value'
			}, {
				prop : ''
			});
		}).should.throw();
	});
});

describe('dataValidator.validateUsername', function(){
	it('should return false if the username length is lower than 3 or higher than 25', function(){
		dv.validateUsername('ab').should.be.false;
		dv.validateUsername('thats1asuper2longusername3').should.be.false;
	});

	it('should return true if the username contains between 3 and 25 alphanumeric characters (including the underscore)', function(){
		dv.validateUsername('123test9ing123').should.be.true;
	});

	it('should return false if the username contains forbidden characters', function(){
		dv.validateUsername('John-Smith').should.be.false;
		dv.validateUsername('John Smith').should.be.false;
	});
});

describe('dataValidator.validatePassword', function(){
	it('should return false if the password length is lower than 8', function(){
		dv.validatePassword('short').should.be.false;
	});

	it('should return true if the password length is higher than 8 or equal', function(){
		dv.validatePassword('abc 123!').should.be.true;
	});
});

describe('dataValidator.validateEmail', function(){
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

