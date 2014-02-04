var deckEdit = require('../models/deckedit');

module.exports = function (socket) {
  socket.on('saveFlashcard', function (flashcard) {
    deckEdit.saveFlashcard(socket.handshake.user.id, flashcard)
    .then(function (flashcardId) {
      console.log('emit flashcardSaved with localId=' + flashcard.localId +
                  ' and id=' + flashcardId);
      socket.emit('flashcardSaved', {
        localId: flashcard.localId, 
        id     : flashcardId
      });
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('saveFlashcardError', flashcard);
    })
    .done();
  });

  socket.on('moveFlashcard', function (data) {
    deckEdit.moveFlashcard(socket.handshake.user.id, 
                           data.flashcardId,
                           data.beforeId)
    .then(function () {
      socket.emit('flashcardMoved', data);
    })
    .catch(function () {
      socket.emit('moveFlashcardError', data);
    })
    .done();
  });

  socket.on('deleteFlashcard', function (flashcard) {
    deckEdit.deleteFlashcard(socket.handshake.user.id, flashcard.id)
    .then(function () {
      socket.emit('flashcardDeleted', flashcard);
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('deleteFlashcardError', flashcard);
    })
    .done();
  });
};

