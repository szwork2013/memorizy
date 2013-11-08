var pg = require('pg');
var util = require('util');
var q = require('q');

function db(){
	this.conn = 'postgres://postgres:cL1475369!@localhost:5432/study';
}

var singleton = new db();

db.prototype.executePreparedStatement = function(pstat){
	var deferred = q.defer();
	pg.connect(this.conn, function(err, client, done) {
		if(err) {
			deferred.reject(err);
		}
		else {
			console.log('Send query...');
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

//NOT TESTED
db.prototype.executeParameterizedQuery = function(query, values){
	var deferred = q.defer();
	pg.connect(this.conn, function(err, client, done) {
		if(err) {
			deferred.reject(err);
			done(client);
		}
		else {
			client.query(query, values, function(err, result) {
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

module.exports = singleton;
