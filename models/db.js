var pg = require('pg');
var util = require('util');

function db(){
	this.conn = 'postgres://postgres:cL1475369!@localhost:5432/study';
}

var singleton = new db();

db.prototype.executePreparedStatement = function(pstat, callback){
	pg.connect(this.conn, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query(pstat, function(err, result) {
			//call `done()` to release the client back to the pool
			done();
			if (callback) {
				callback(err, result);
			}
		});
	});
};

module.exports = singleton;
