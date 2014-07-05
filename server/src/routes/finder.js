(function () {
  'use strict';

  var finderModel = require('../models/finder.js');

  module.exports = function (app) {
    app.get('/api/finder', function (req, res) {
      finderModel.find(req.user.id, req.query.q).then(function (results) {
        console.log('results = ', results);
        res.json(results.rows);
      }).catch(function (err) {
        console.log(err);
        res.send(404);
      });
    });
  };

})();
