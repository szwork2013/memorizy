var pg = require('pg');
var util = require('util');
var q = require('q');

function db(){
	this.conn = 'postgres://postgres:cL1475369!@localhost:5432/study';
}

var singleton = new db();

db.prototype.executePreparedStatement = function(pstat){
	var deferred = q.defer();
	console.log('call executePreparedStatement');
	pg.connect(this.conn, function(err, client, done) {
		if(err) {
			console.log('1');
			deferred.reject(err);
			return;
		}
		console.log('no err for pg.connect');
		client.query(pstat, function(err, result) {
			console.log('2');
			//call `done()` to release the client back to the pool
			done();
			if (err) {
				console.log('3');
				deferred.reject(err);
				return;
			}
			console.log('4');
			deferred.resolve(result);
		});
	});
	return deferred.promise;
};

module.exports = singleton;
