var deckModel = require('../models/deck.js');

module.exports = function (app) {
  app.put('/api/:username/:files?*', function (req, res, next) {
    if (req.query.action !== 'getDecks') {
      return next();
    }

    var deckIds = req.body;
    deckModel.getDecks(req.user.id, deckIds).then(function (decks) {
      res.json(decks);
    }).catch(function (err) {
      console.log(err);
      res.send(404);
    });

  });
};
