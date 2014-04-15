var deckStudy = require('../models/deckstudy.js');
module.exports = function (app) {
  app.post('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateStats') {
      return next();
    }

    deckStudy.updateStats(req.user.id, req.body).then(function () {
      res.send(204);
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    });
  });

  app.put('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateFlashcardOrder') {
      return next();
    }

    deckStudy.updateFlashcardOrder(req.user.id, req.body.fileId, req.body.flashcardOrderId).
      then(function () {
        res.send(204);
      }).
      catch(function (err) {
        console.log(err);
        res.send(400);
      });
  });

  app.put('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateStudyMethod') {
      return next();
    }

    deckStudy.updateStudyMethod(req.user.id, req.body.fileId, req.body.studyMethod).
      then(function () {
        res.send(204);
      }).
      catch(function (err) {
        console.log(err);
        res.send(400);
      });
  });

  app.put('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'updateShowFirst') {
      return next();
    }

    deckStudy.updateShowFirst(req.user.id, req.body.fileId, req.body.showFirst).
      then(function () {
        res.send(204);
      }).
      catch(function (err) {
        console.log(err);
        res.send(400);
      });
  });
};

