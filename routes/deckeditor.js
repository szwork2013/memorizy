var deckEditor = require('../models/deckeditor.js');
module.exports = function (app) {
  app.post('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'saveFlashcard') {
      return next();
    }

    deckEditor.saveFlashcard(2, req.body)
    .then(function (flashcard) {
      res.json(flashcard);
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    })
    .done();
  });

  app.delete('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'deleteFlashcard') {
      return next();
    }
    
    var flashcardId = parseInt(req.query.flashcardId);
    deckEditor.deleteFlashcard(req.user.id, flashcardId). 
      then(function () {
        res.send(204);
      }).
      catch(function (err) {
        console.log(err);
        res.send(404);
      });
  });
};
