var q = require('q');
var fs = require('fs');
var crypto = require('crypto');
var db = require('./db');

function DeckEditor () {}

var singleton = new DeckEditor();

/**
 * saveFlashcard
 *
 * @param {number} userId
 * @param {object} flashcard contains the information to identify
 *    the flashcard, and its fields to update
 * @return {Promise} A promise resolved with the flashcard id
 *    if the flashcard has been saved, a promise rejected with
 *    the error otherwise
 */
DeckEditor.prototype.saveFlashcard = function (userId, flashcard) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (Object.prototype.toString.call(flashcard) !== '[object Object]') {
    return q.reject('flashcard = ' + flashcard + ' (expected an object)');
  }

  // If term/definition is undefined, 'undefined'
  // is inserted in the database, however,
  // plpgsql functions will consider term and 
  // definition as null if they are null as
  // javascript variables
  console.log('Before nullification:', flashcard);
  this._nullifyFlashcardUpdates(flashcard);
  console.log('After nullification:', flashcard);

  if (typeof flashcard.id === 'number') {
    return this._updateFlashcard(userId, flashcard);
  }
  if (typeof flashcard.deck_id === 'number') {
    return this._appendFlashcard(userId, flashcard);
  }

  return q.reject('Flashcard must have either an id ' +
                  'or the id of its deck');
};

DeckEditor.prototype._appendFlashcard = function (userId, flashcard) {
  if (typeof flashcard.deck_id !== 'number') {
    return q.reject('flashcard.deck_id = ' + flashcard.deck_id + 
                    ' (expected a number)');
  }

  return db.executePreparedStatement({
    name : 'appendFlashcard',
    text : 'select append_flashcard($1::INTEGER, $2::INTEGER,' +
                                   '$3::TEXT, $4::INTEGER,' +
                                   '$5::TEXT, $6::TEXT,' +
                                   '$7::INTEGER, $8::TEXT)',
    values : [
      userId, flashcard.deck_id, 
      flashcard.term_text, flashcard.term_media_id, 
      flashcard.term_media_position, 
      flashcard.definition_text, flashcard.definition_media_id,
      flashcard.definition_media_position
    ]
  }).then(function (res) {
    return res.rows[0].append_flashcard;
  });
};

DeckEditor.prototype._updateFlashcard = function (userId, flashcard) {
  if (typeof flashcard.id !== 'number') {
    return q.reject('flashcard.id = ' + flashcard.id + 
                    ' (expected a number)');
  }

  return db.executePreparedStatement({
    name : 'saveFlashcard',
    text : 'select update_flashcard($1::INTEGER, $2::INTEGER,' +
                                   '$3::TEXT, $4::INTEGER,' +
                                   '$5::TEXT, $6::TEXT,' +
                                   '$7::INTEGER, $8::TEXT)',
    values : [
      userId, flashcard.id, 
      flashcard.term_text, flashcard.term_media_id, 
      flashcard.term_media_position, 
      flashcard.definition_text, flashcard.definition_media_id,
      flashcard.definition_media_position
    ]
  }).then(function (res) {
    return res.rows[0].update_flashcard;
  });
};

/**
 * Used for flashcard updates
 * nullification
 * @private
 */
var _FLASHCARD_EDITABLE_FIELDS= [
  'term_text',
  'term_media_id',
  'term_media_position',
  'definition_text',
  'definition_media_id',
  'definition_media_id'
];

DeckEditor.prototype._nullifyFlashcardUpdates = function (flashcard) {
  for (var i in _FLASHCARD_EDITABLE_FIELDS) {
    var prop = _FLASHCARD_EDITABLE_FIELDS[i];

    if (typeof flashcard[prop] === 'undefined') {
      flashcard[prop] = null;
    }
  }
};

/**
 * moveFlashcard
 *
 * @param {number} userId
 * @param {number} flashcardId
 * @param {number} beforeId
 * @return {Promise} A resolved promise if the flashcard has been moved, 
 *    a promise rejected with the error otherwise
 */
DeckEditor.prototype.moveFlashcard = function (userId, flashcardId, beforeId) {
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
 *    a promise rejected with the error otherwise
 */
DeckEditor.prototype.removeFlashcard = function (userId, flashcardId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof flashcardId !== 'number') {
    return q.reject('flashcardId = ' + flashcardId + ' (expected an number)');
  }

  console.log('going to delete id ' + flashcardId);
  return db.executePreparedStatement({
    name : 'deleteFlashcard',
    text : 'select delete_flashcard($1, $2)',
    values : [userId, flashcardId]
  });
};

DeckEditor.prototype.createMediaLink = function (path) {
  if (typeof path !== 'string') {
    return q.reject('path = ' + path + ' (expected an string)');
  }

  var rs = fs.ReadStream(path);

  return this._sha256(rs).then(function (shasum) {
    console.log('shasum = ' + shasum);

    return db.executePreparedStatement({
      name: 'createMediaLink',
      text: 'select create_media_link($1)',
      values: [shasum]
    })
    .then(function (res) {
      console.log(res);
      return res.rows[0].create_media_link;
    });
  });
};

DeckEditor.prototype._sha256 = function (readStream) {
  var defer = q.defer();
  var shasum = crypto.createHash('sha256');

  readStream.on('data', function(data) {
    shasum.update(data);
  });

  readStream.on('end', function() {
    var data = shasum.digest('hex');
    defer.resolve(data);
  });

  return defer.promise;
};

DeckEditor.prototype._mimeType = function () {


};

module.exports = singleton;
