(function () {
  'use strict';

  var finderModel = require('../models/finder.js');

  module.exports = function (app) {
    app.get('/api/finder', function (req, res) {
      finderModel.find(req.user.id, req.query.query).then(function (results) {
        res.json(results.rows);
      }).catch(function (err) {
        console.log(err);
        res.send(404);
      });
    });
  };

})();
