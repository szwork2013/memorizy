var should = require('should');
var sinon = require('sinon');
var util = require('util');
var assert = require('assert');

var db = require('../models/db');

describe('db.executePreparedStatement', function(){
	it('should return a rejected promise if connection to the database fail', function(done){
		var conn = db.conn;
		db.conn = 'invalid database address';
		db.executePreparedStatement('test').catch(function(){ done() });
		db.conn = conn;
	});

	it('should return a rejected promise if the query is invalid', function(done){
		db.executePreparedStatement('invalid query').catch(function(){ done() });
	});

	it('should return a resolved promise with query\'s results if the query was successfully executed');
});
