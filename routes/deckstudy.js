var deckStudy = require('../models/deckstudy.js');
module.exports = function (app) {
  app.post('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateStats') {
      return next();
    }

    deckStudy.updateStats(2, req.body).then(function () {
      res.send(204);
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    });
  });

  app.put('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateStudyOrder') {
      return next();
    }

    deckStudy.updateStudyOrder(2, req.body.fileId, req.body.studyOrderId).
      then(function () {
        res.send(204);
      }).
      catch(function (err) {
        console.log(err);
        res.send(400);
      });
  });

};

