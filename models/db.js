var pg = require('pg');
var util = require('util');
var q = require('q');

function db(){
	this.conn = 'postgres://postgres:cL1475369!@localhost:5432/study';
}

var singleton = new db();

/**
 * executePreparedStatement
 *
 * @param pstat An object literal containing :
 *  name : 'the name of the prepared statement',
 *  text : 'query with $1, $2, ... as arguments',
 *  values : An array of arguments values
 *
 * @return A Query object containing information
 * about the query executed and its results
 */
db.prototype.executePreparedStatement = function(pstat){
	var deferred = q.defer();
	pg.connect(this.conn, function(err, client, done) {
		if(err) {
			deferred.reject(err);
		}
		else {
			client.query(pstat, function(err, result) {
				//call `done()` to release the client back to the pool
				done();
				if (err) {
					deferred.reject(err);
				}
				else {
					deferred.resolve(result);
				}
			});
		}
	});
	return deferred.promise;
};

/**
 * NOT TESTED executeParameterizedQuery
 *
 * @param query Query with $1, $2, ... for arguments
 * @param values An array containing query arguments
 * @return A query object containing the query results 
 * and information about the query
 */
/*
 *db.prototype.executeParameterizedQuery = function(query, values){
 *        var deferred = q.defer();
 *        pg.connect(this.conn, function(err, client, done) {
 *                if(err) {
 *                        deferred.reject(err);
 *                        done(client);
 *                }
 *                else {
 *                        client.query(query, values, function(err, result) {
 *                                //call `done()` to release the client back to the pool
 *                                done();
 *                                if (err) {
 *                                        deferred.reject(err);
 *                                }
 *                                else {
 *                                        deferred.resolve(result);
 *                                }
 *                        });
 *                }
 *        });
 *        return deferred.promise;
 *};
 */

db.prototype.stringToPGPath = function(path){
	if (typeof path != 'string') {
		throw new Error('path = ' + path + ' (expected a string)');	
	}
	
	if (path.length == 0) {
		throw new Error('path must not be empty');
	}

	var regex = /\w+/g;
	var tmp;
	var pgArray;

	// /a/b/c/ -> array['a','b','c']
	if((tmp = regex.exec(path)) !== null){
		pgArray = 'array[\'' + tmp[0] + '\'';

		while ((tmp = regex.exec(path)) !== null){
			pgArray += ',\'' + tmp[0] + '\'';
		}
		pgArray += ']';
	}
	else {
		throw new Error('path contains invalid characters');
	}


	return pgArray;
};

module.exports = singleton;
