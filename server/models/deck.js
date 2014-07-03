(function () {
  'use strict';

  var db = require('./db'),
      q  = require('q');

  /** @constructor */
  function Deck () {}

  Deck.prototype = {

    /**
     * Retrieves deck flashcards in the given order
     *
     * @param {number} userId
     * @param {number} deckId
     * @param {number} flashcardOrderId
     * @return {Promise} A promise fulfilled with an object containing
     *    information and flashcards of the requested deck, or a promise
     *    rejected with the error
     */
    getFlashcards: function (userId, deckId, flashcardOrderId) {
      if (typeof userId !== 'number') {
        return q.reject('userId = ' + userId + ' (expected a number)');	
      }
      if (typeof deckId !== 'number') {
        return q.reject('deckId = ' + deckId + ' (expected a number)');
      }
      if (typeof flashcardOrderId === 'undefined') { flashcardOrderId = 1; }
      else if (typeof flashcardOrderId !== 'number') {
        return q.reject('flashcardOrderId = ' + flashcardOrderId + ' (expected a number)');
      }

      return db.executePreparedStatement({
        name: 'getFileFlashcards',
        text: 'select * from get_flashcards($1, $2, $3)',
        values: [ userId, deckId, flashcardOrderId ]
      })
      .then(function (res) {
        return res.rows;
      });
    },

    /**
     * getDecks
     *
     * @param {number} userId
     * @param Array<number> deckIds
     * @return Promise a promise fulfilled with all requested decks information
     *    and flashcards if they are all available, or rejected with the error
     *    if they are not
     */
    getDecks: function (userId, deckIds) {
      var decks = {};
      var deferred = [];

      for (var i in deckIds) {
        deferred.push(getOneDeck(userId, deckIds[i]));  
      }

      return q.all(deferred).then(function () {
        for (var i in deckIds) {
          decks[deckIds[i]] = arguments[i];
        }  

        return decks;
      });  
    }
  };

  var singleton = new Deck();

  module.exports = singleton;

})();
