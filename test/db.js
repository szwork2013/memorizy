var should = require('should');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');
var pg = require('pg');

var db = require('../models/db');

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
		});
	});

	it('should return a rejected promise if the query is invalid', function(done){
		db.executePreparedStatement('invalid query').catch(function(){ done() });
	});

	it('should return a resolved promise with query\'s results if the query was successfully executed');
});
