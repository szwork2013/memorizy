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
};
