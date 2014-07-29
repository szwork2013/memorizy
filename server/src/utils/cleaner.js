(function () {
  'use strict';

  var fs = require('fs'),
      path = require('path'),
      db = require('../models/db');

  function Cleaner () { this.workingDir = ''; }

  Cleaner.prototype.removeUnlinkedMedia = function () {
    function getUnlinkedMedia () {
      return db.executePreparedStatement({
        name: 'getUnlinkedMedia',
        text: 'select id from images where links = 0',
        values: []
      });
    }

    function removeDbEntry () {
      return db.executePreparedStatement({
        name: 'removeUnlinkedMedia',
        text: 'delete from images where links = 0',
        values: []
      });
    }

    var that = this;
    return getUnlinkedMedia().then(function (res) {
      res.rows.forEach(function(row) {
        var p = path.join(that.workingDir, row.id);
        fs.exists(p, function(exists) {
          if (exists) {
            fs.unlink(p, function (err) {
              if (err) { throw err; }
              console.log(p + ' removed from disk');
            });
          } 
          removeDbEntry().then(function () {
            console.log(p + ' removed from db');
          });
        });
              
      });
    });
  };

  var singleton = new Cleaner();
  module.exports = singleton;

})();
