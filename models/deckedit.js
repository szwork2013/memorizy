var q = require('q');
var db = require('./db');

function DeckEdit () {}

var singleton = new DeckEdit();

/**
 * saveFlashcard
 *
 * @param {number} userId
 * @param {object} flashcard contains the information to identify
 *  the flashcard, and its fields to update
 * @return {Promise} A promise resolved with the flashcard id
 *  if the flashcard has been saved, a promise rejected with
 *  the error otherwise
 */
DeckEdit.prototype.saveFlashcard = function (userId, flashcard) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (Object.prototype.toString.call(flashcard) !== '[object Object]') {
    return q.reject('flashcard = ' + flashcard + ' (expected an object)');
  }

  // If term/definition is undefined, 'undefined'
  // is inserted in the database, however,
  // plpgsql function will consider term and 
  // definition as null if they are
  if (typeof flashcard.term === 'undefined') {
    flashcard.term = null;
  }
  if (typeof flashcard.definition === 'undefined') {
    flashcard.definition = null;
  }

  if (typeof flashcard.id === 'number') {
    return db.executePreparedStatement({
      name : 'saveFlashcard',
      text : 'select update_flashcard($1::INTEGER, $2::INTEGER,' +
                                     '$3::TEXT, $4::TEXT)',
      values : [
        userId, flashcard.id, 
        flashcard.term, 
        flashcard.definition
      ]
    });
  }
  if (typeof flashcard.deckId === 'number') {
    return db.executePreparedStatement({
      name : 'appendFlashcard',
      text : 'select append_flashcard($1::INTEGER, $2::INTEGER,' +
                                     '$3::TEXT, $4::TEXT)',
      values : [
        userId, flashcard.deckId, 
        flashcard.term, 
        flashcard.definition
      ]
    });
  }

  return q.reject('Flashcard must have either an id ' +
                  'or the id of its deck');
};

/**
 * moveFlashcard
 *
 * @param {number} userId
 * @param {number} flashcardId
 * @param {number} beforeId
 * @return {Promise} A resolved promise if the flashcard has been moved, 
 * a promise rejected with the error otherwise
 */
DeckEdit.prototype.moveFlashcard = function (userId, flashcardId, beforeId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof flashcardId !== 'number') {
    return q.reject('flashcardId = ' + flashcardId + ' (expected an number)');
  }
  if (typeof beforeId !== 'number') {
    return q.reject('beforeId = ' + beforeId + ' (expected an number)');
  }

  return db.executePreparedStatement({
    name : 'moveFlashcard',
    text : '',
    values : []
  });
};

/**
 * deleteFlashcard
 *
 * @param {number} userId
 * @param {number} flashcardId
 * @return {Promise} A resolved promise if the flashcard has been deleted, 
 * a promise rejected with the error otherwise
 */
DeckEdit.prototype.deleteFlashcard = function (userId, flashcardId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof flashcardId !== 'number') {
    return q.reject('flashcardId = ' + flashcardId + ' (expected an number)');
  }

  return db.executePreparedStatement({
    name : 'deleteFlashcard',
    text : '',
    values : []
  });
};

module.exports = singleton;

