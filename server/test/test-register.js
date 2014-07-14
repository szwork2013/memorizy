var should = require('should');
var sinon = require('sinon');
var q = require('q');
var db = require('../models/db');
var register = require('../models/register');

describe('register.createUser', function(){ 
	var valid = {
		username : 'test',
		password : 'test1234',
		email : 'test@test.com'
	};
	var invalid = {
		username : 'ab',
		password : 'ab',
		email : 'test'
	};

	it('should return a rejected promise if user properties are not an object literal', function(done){
		register.createUser('not an object literal').then(function(){
			done(new Error('should have returned a rejected promise'));
		})
		.catch(function(){
			done();
		})
		.done();
	});

	it('should return a rejected promise if at least one required user property is missing, without hitting the database', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement');

		var err = new Error('should have returned a rejected promise');
		register.createUser({ password: valid.password, email : valid.email }).isRejected().should.be.true; 
		register.createUser({ username : valid.user, email : valid.email}).isRejected().should.be.true; 
		register.createUser({ username : valid.user, password : valid.password }).isRejected().should.be.true; 

		stub.callCount.should.eql(0);
		stub.restore();
		done();
	});

	it('should return a rejected promise if at least one required user property is invalid, without hitting the database', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement');

		var err = new Error('should have returned a rejected promise');
		register.createUser({ username : invalid.username, password: valid.password, email : valid.email }).isRejected().should.be.true; 
		register.createUser({ username : valid.user, password : invalid.password, email : valid.email }).isRejected().should.be.true; 
		register.createUser({ username : valid.user, password : valid.password, email : invalid.email }).isRejected().should.be.true; 

		stub.callCount.should.eql(0);
		stub.restore();
		done();
	});

	it('should try to send the query to the database if all parameters are supplied and valid', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject('test'));
		register.createUser(valid);
		stub.calledOnce.should.be.true;
		stub.restore();
		done();
	});

	it('should return a rejected promise if the user cannot be created because the query execution failed', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		register.createUser(valid).then(function(){
			done(new Error('register.createUser should have returned a rejected promise'));
		})
		.catch(function(){
			stub.calledOnce.should.be.true;
			stub.restore();
			done();
		})
		.done();

	});

	it('should return a rejected promise if the user hasn\'t been created but the query has been executed successfully', function(done){
		var res = {
			value: {
				rows: [{created: false}]
			}
		};
		stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(res));
		register.createUser(valid).then(function(){
			done(new Error('register.createUser should have returned a rejected promise'));
		}).catch(function(){
			stub.calledOnce.should.be.true;
			stub.restore();
			done();
		})
		.done();
	});

	it('should return a resolved promise if the user has been created successfully', function(done){
		var res = {
			value: {
				rows: [{created: true}]
			}
		};
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(res));
		register.createUser(valid).then(function(){
			stub.calledOnce.should.be.true;
			stub.restore();
			done();
		})
		.catch(done)
		.done();
	});
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
