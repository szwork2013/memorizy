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
      f.studied++;

      if (f.status === 3 && that.subdeck) { 
        console.log('remove flashcard because status == 3');
        // the flashcard is at 100%, we remove it from the subdeck
        that.subdeck.indexes.splice(that.subdeck.index, 1);
        // we add the next flashcard to the subdeck
        if (that.subdeck.end + 1 < that.deck.flashcards.length) {
          console.log('add another flashcard');
          that.subdeck.end++; // increment the index of the subdeck's last flashcard 
          that.subdeck.indexes.push(that.subdeck.end);
        }

				// decrements the index because an index has been removed
				// from subdeck.indexes
				that.subdeck.index--;
      }
      
      that.next.call(that);
    });

		$rootScope.$on('method', function (event, method) {
			if (method === that.options.Methods.GET100) {
				that.subdeck = {
					index: 0,
					begin: that.index,
					end  : Math.min((that.index + that.SUBDECK_MAX_LENGTH - 1), that.deck.flashcards.length - 1),
					indexes: []
				};
				for (var i = 0; i <= that.subdeck.end - that.subdeck.begin; i++) {
					that.subdeck.indexes[i] = that.subdeck.begin + i;
				}
			}
			else {
				console.log('set subdeck to null');
				that.subdeck = null;
			}
		});
  }

	StudySession.prototype.SUBDECK_MAX_LENGTH = 10;

  StudySession.prototype.configure = function (deck, config) {
    this.deck = deck;
    this.index = 0;
    this.options.configure(this, config);
    this.stats.reset();

    if (this.options.method === this.options.Methods.GET100) {
      this.subdeck = {
        index: 0,
        begin: 0,
        end  : Math.min(this.SUBDECK_MAX_LENGTH - 1, deck.flashcards.length - 1),
        indexes: []
      };

      console.log('subdeck end: ' + this.subdeck.end);
      for (var i = 0; i <= this.subdeck.end - this.subdeck.begin; i++) {
        this.subdeck.indexes[i] = this.subdeck.begin + i;
      }
    }
    else {
      this.subdeck = null;
    }
  };

  StudySession.prototype.addAnswer = function (flashcard, correct) {
    if (correct === false) { 
      flashcard.status = -1; 
    }
    else if (flashcard.status === -1 && correct === true) { 
      flashcard.status = 1; 
    }
    else if (flashcard.status < 3) { 
      flashcard.status++; 
    }

    this.stats.setStatus(flashcard, flashcard.status);
  };

  StudySession.prototype.next = function () {
    if (!this.subdeck) { // Classic method
      if (this.index < this.deck.flashcards.length - 1) { this.index++; }
      else { this.end(); }
    }
    else { // get 100 method
      if (this.subdeck.indexes.length === 0) {
        this.end();
      }
      else {
        this.subdeck.index = (this.subdeck.index + 1) % this.subdeck.indexes.length;
				this.index = this.subdeck.indexes[this.subdeck.index];
      }
    }
  };

  StudySession.prototype.end = function () {
    this.$rootScope.$emit('end');
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
