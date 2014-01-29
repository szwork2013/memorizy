var deckEdit = require('../models/deckedit');

module.exports = function (socket) {
  socket.on('saveFlashcard', function (flashcard) {
    deckEdit.saveFlashcard(socket.handshake.user.id, flashcard)
    .then(function (flashcard) {
      socket.emit('flashcardSaved', {flashcardId: flashcard});
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('saveFlashcardError');
    })
    .done();
  });

  socket.on('moveFlashcard', function (data) {
    deckEdit.moveFlashcard(socket.handshake.user.id, 
                           data.flashcardId,
                           data.beforeId)
    .then(function () {
      socket.emit('flashcardMoved', {flashcardId: data.flashcardId});
    })
    .catch(function () {
      socket.emit('moveFlashcardError', {flashcardId: data.flashcardId});
    })
    .done();
  });

  socket.on('deleteFlashcard', function (flashcard) {
    deckEdit.deleteFlashcard(socket.handshake.user.id, flashcard.id)
    .then(function () {
      socket.emit('flashcardDeleted', {flashcardId: flashcard.id});
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('deleteFlashcardError', {
        flashcardId: flashcard.id
      });
    })
    .done();
  });
};

