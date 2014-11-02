(function () {
  'use strict';

  var pg = require('pg');
  var q = require('q');

  function Db() {
    this.conn = null;
    this.nodepgConn = null;
  }

  var singleton = new Db();

  Db.prototype.pgConnect = function (callback) {
    pg.connect(this.nodepgConn, function (err, client, done) {
      if (err) {
        console.log(JSON.stringify(err));
      }
      if (client) {
        callback( client);
        done();
      }
    });
  };

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
  Db.prototype.executePreparedStatement = function (pstat) {
    var deferred = q.defer();
    pg.connect(this.conn, function (err, client, done) {
      if (err) {
        deferred.reject(err);
      }
      else {
        client.query(pstat, function (err, result) {
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

  Db.prototype.stringToPGPath = function (path) {
    if (typeof path !== 'string') {
      throw new Error('path = ' + path + ' (expected a string)');
    }

    if (path.length === 0) {
      throw new Error('path must not be empty');
    }

    var regex = /\w+/g;
    var tmp;
    var pgArray;

    // /a/b/c/ -> array['a','b','c']
    if ((tmp = regex.exec(path)) !== null) {
      pgArray = 'array[\'' + tmp[0] + '\'';

      while ((tmp = regex.exec(path)) !== null) {
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
})();
