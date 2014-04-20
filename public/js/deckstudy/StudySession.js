(function () {
  'use strict';

  function StudySession ($rootScope, studyOptions, studyStats) {
    this.$rootScope = $rootScope;
    this.options = studyOptions;
    this.stats = studyStats;

    this.deck = null;
    this.subdeck = null;

    this.index = 0;
    
    // event listeners
    var that = this;
    $rootScope.$on('answered', function (event, answer) {
      var f = answer.flashcard;
      if (answer.correct === false) { f.status = -1; }
      else if (f.status === -1 && answer.correct === true) { f.status = 1; }
      else if (f.status < 3) { f.status++; }
      else if (this.subdeck) { 
        // the flashcard is at 100%, we remove it from the subdeck
        this.subdeck.cards = this.subdeck.cards.splice(this.subdeck.index, 1);
        // we add the next flashcard to the subdeck
        if (this.subdeck.end + 1 < this.deck.flashcards.length) {
          this.subdeck.end++; // increment the index of the subdeck's last flashcard 
          this.subdeck.cards.push(this.deck.flashcards[this.subdeck.end]);
        }
      }
      
      that.next.call(that);
    });
  }

  StudySession.prototype.configure = function (deck, config) {
    this.deck = deck;
    this.index = 0;
    this.options.configure(this, config);
    this.stats.reset();

    if (this.options.method === this.options.Methods.GET100) {
      this.subdeck = {
        index: 0,
        begin: 0,
        end  : 10,
        cards: this.deck.flashcards.slice(0, 10)
      };
    }
    else {
      this.subdeck = null;
    }
  };

  StudySession.prototype.addAnswer = function (flashcard, correct) {
    this.stats.addAnswer(flashcard, correct);
  };

  StudySession.prototype.next = function () {
    if (!this.subdeck) { // Classic method
      if (this.index < this.deck.flashcards.length - 1) { this.index++; }
      else { this.$rootScope.$emit('end'); }
    }
    else { // get 100 method
      if (this.subdeck.cards.length === 0) {
        this.$rootScope.$emit('end');
      }
      else {
        this.subdeck.index = (this.subdeck.index + 1) % this.subdeck.cards.length;
      }
    }
  };

  angular.module('memorizy.deckstudy.StudySession', []). 
    provider('studySession', function () {
    this.$get = [
      '$rootScope',
      'studyOptions',
      'studyStats',
      function ($rootScope, studyOptions, studyStats) {
        return new StudySession($rootScope, studyOptions, studyStats);
      }
    ];
  });
})();
