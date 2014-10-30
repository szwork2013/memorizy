(function () {
  'use strict';

  function DeckEditorModel (socket, $location, $upload) {
    this.socket = socket;
    this.$location = $location;
    this.$upload = $upload;

    this.deck = null;

    var self = this;

    this.getIndex = function(flashcardId) {
      for (var i = 0; i < this.deck.flashcards.length; i++) {
        if (this.deck.flashcards[i].id === flashcardId) {
          return i;
        }
      }

      return -1;
    };

    socket.on('flashcard:saved', function(data) {
      if (typeof data.queryId !== 'undefined') {
        self.deck.queryForId[data.queryId].id = data.id;
      }
    });

    socket.on('flashcard:moved', function(data) {
      var index = self.getIndex(data.id),
          flashcard = self.deck.flashcards.splice(index, 1)[0];

      self.deck.flashcards.splice(data.newPosition, 0, flashcard);
    });

    socket.on('flashcard:removed', function(flashcard) {
      var index = self.getIndex.call(self, flashcard.id);

      self.deck.flashcards.splice(index, 1);
      if (self.deck.flashcards.length === 0) {
        self.addFlashcard();
      }
    });
  }

  DeckEditorModel.prototype = {
    init: function (deck) {
      this.deck = deck;
    },

    addFlashcard: function () {
      var flashcard = {
        deck_id: this.deck.id,
        term_text: '',
        definition_text: ''
      };
      this.deck.flashcards.push(flashcard);
      return flashcard;
    },

    saveFlashcard: function (flashcard) {
      var queryId;
      if (typeof flashcard.id === 'undefined') {
        this.deck.queryForId = this.deck.queryForId || [];
        queryId = this.deck.flashcards.length;
        this.deck.queryForId.push(flashcard);
      }
    
      this.socket.emit('flashcard:save', {
        flashcard: flashcard,
        queryId: queryId
      });
    },

    moveFlashcard: function(from, to) {
      if (from === to) {
        return;
      }

      if (this.deck.flashcards[from].id) {
        this.socket.emit('flashcard:move', {
          id:          this.deck.flashcards[from].id,
          newPosition: to
        });
      }
      else {
        var flashcard = this.deck.flashcards.splice(from, 1)[0];
        this.deck.flashcards.splice(to, 0, flashcard);
      }
    },

    removeFlashcard: function (index) {
      var f = this.deck.flashcards[index];

      if (f.id) {
        this.socket.emit('flashcard:remove', { id: f.id });      
      }
      else {
        this.deck.flashcards.splice(index, 1);
        if (this.deck.flashcards.length === 0) {
          this.addFlashcard();
        }
      }
    },

    upload: function (file) {
      return this.$upload.upload({
        url: '/upload', 
        method: 'POST',
        file: file
      }).progress(function(evt) {
        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      });
    },

    uploadTermMedia: function (file) {
      var flashcard = this.deck.flashcards[this.deck.active];
      return this.upload(file).success(function(data, status, headers, config) {
        flashcard.term_media_id = data;   
      });
    },

    uploadDefinitionMedia: function (file) {
      var flashcard = this.deck.flashcards[this.deck.active];
      return this.upload(file).success(function(data, status, headers, config) {
        flashcard.definition_media_id = data;   
      });
    }
  };

  angular.module('memorizy.deckeditor.DeckEditorModel', []).
    provider('deckEditorModel', function () {
      this.$get = [
        'socketio', 
        '$location', 
        '$upload', 
        function (socket, $location, $upload) {
          return new DeckEditorModel(socket, $location, $upload);
        }
      ];
    }); 

})();
