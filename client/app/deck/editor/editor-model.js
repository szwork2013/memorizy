(function () {
  'use strict';

  function DeckEditorModel ($http, $location, $upload) {
    this.$http = $http;
    this.$location = $location;
    this.$upload = $upload;

    this.deck = null;
  }

  DeckEditorModel.prototype = {
    init: function (deck) {
      this.deck = deck;
    },

    addFlashcard: function () {
      this.deck.flashcards.push({
        deck_id: this.deck.id,
        term_text: '',
        definition_text: ''
      });
    },

    saveFlashcard: function (flashcard) {
      console.log('save flashcard ', flashcard);
      return this.$http.post('/api' + this.$location.path(), flashcard, { 
        params: { action: 'saveFlashcard' }
      });
    },

    removeFlashcard: function (index) {
      var f = this.deck.flashcards[index];
      var ret = null;
      if (f.id) {
        ret = this.$http.delete('/api' + this.$location.path(), { 
          params: { 
            action: 'deleteFlashcard',
            flashcardId: f.id 
          }
        });
      }

      this.deck.flashcards.splice(index, 1);
      if (this.deck.flashcards.length === 0) {
        this.addFlashcard();
      }

      return ret;
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
    provider('DeckEditorModel', function () {
      this.$get = [
        '$http', 
        '$location', 
        '$upload', 
        function ($http, $location, $upload) {
          return new DeckEditorModel($http, $location, $upload);
        }
      ];
    }); 

})();
