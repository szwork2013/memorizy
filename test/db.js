var should = require('should');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');
var pg = require('pg');
var client = require('../node_modules/pg/lib/client');

var db = require('../models/db');


after(function(){
	// prevent postgres from 'unexpected EOF on client connection' errors
	pg.end();
});

describe('db.executePreparedStatement', function(){
	it('should return a rejected promise if connection to the database fail', function(done){
		var stub = sinon.stub(pg, 'connect', function(conn, callback){
			callback(new Error('Could not connect to the database'));
		});

		db.executePreparedStatement('select 1').then(function(){
			done(new Error('db.executePreparedStatement should have returned a rejected promise'));	
		}).catch(function(){ 
			stub.calledOnce.should.be.true;
			stub.restore();
			done();
		})
		.done();
	});

	it('should return a rejected promise if the query cannot be executed', function(done){
		var stub = sinon.stub(client.prototype, 'query', function(pstat, callback){
			callback(new Error('Query execution failed'));
		});

		db.executePreparedStatement('select 1').then(function(){
			done(new Error('db.executePreparedStatement should have returned a rejected promise'));	
		}).catch(function(){ 
			stub.calledOnce.should.be.true;
			stub.restore();
			done();
		})
		.done();
	});

	it('should return a resolved promise with query\'s results if the query was successfully executed', function(done){
		var stubCon = sinon.stub(pg, 'connect', function(conn, callback){
			// Consider that connection to the database has succeeded
			callback(null, new client(), function(){});	
		});
		var stubQuery = sinon.stub(client.prototype, 'query', function(pstat, callback){
			// Consider that the query has been executed successfully
			callback(null, 'some results');	
		});

		db.executePreparedStatement('query data').then(function(){
			done();
		})
		.catch(done)
		.finally(function(){
			stubCon.restore();
			stubQuery.restore();
		})
		.done();
	});
});

describe.only('db.stringToPGPath', function(){
	it('should return a postgres array corresponding to the js array passed as argument', function(){
		db.stringToPGPath('/carl/utc/mi01').should.eql('array[\'carl\',\'utc\',\'mi01\']');
	});
});


