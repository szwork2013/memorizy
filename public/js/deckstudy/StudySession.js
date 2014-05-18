(function () {
  'use strict';

  /**
   * SessionManager handles one or several study sessions
   *
   * @constructor
   * @param $rootScope
   */
  function SessionManager ($rootScope, $http, $location) {

    this.$rootScope = $rootScope;
    this.$http      = $http;
    this.$location  = $location;

    /**
     * There is one session per deck to study
     */
    this.sessions = [];

    /**
     * Index of the active session in 'sessions' property
     */
    this.activeSessionIdx = -1;

    var self = this;
    $rootScope.$on('sessionEnd', function (e, sessionIdx) {
      self.next();
    });

    $rootScope.$on('end', function () {
      var status = {};
      for (var i in this.sessions) {
        var s = this.sessions[i].status;
        for (var j in s) {
          if (s.hasOwnProperty(j)) {
            status[j] = s[j];
          }
        }
      }

      console.log('status = ', status);
      return this.$http.put('/api' + this.$location.path(), status, {
        params: { action: 'updateStatus' }
      });
    }.bind(this));
  }

  SessionManager.prototype = {

    /**
     * Create a new session for each deck in decks
     * @param {Array<Object>} decks
     */
    configure: function (decks) {
      this.reset();

      for (var i in decks) {
        // TODO: Break dependency injection paradigm, should not pass 
        // $rootScope as argument
        this.sessions.push(new Session(
          this.$rootScope, this.$http, this.$location, decks[i]));
      }
      this.activeSessionIdx = 0;

      console.log('sessions: ', this.sessions);
    },

    /**
     * Goes to the next session which is not completed yet,
     * if there is no incomplete session after the active one,
     * it looks at the sessions before it
     */
    next: function () {
      var found = false,
          iterations = 0,
          idx, session;

      // TODO Make a faster algorithm to find the next session
      while (!found && (iterations + 1) < this.sessions.length) {
        iterations++;
        idx = (this.activeSessionIdx + iterations) % this.sessions.length;
        session = this.sessions[idx];

        console.log('session at index ' + idx + ': ' + session.complete);
        if (!session.complete) { found = true; }
      }

      if (found) { console.log('set idx to ' + idx); this.activeSessionIdx = idx; }
      else { this.$rootScope.$emit('end'); } // No more deck to study
    },

    /**
     * Reset properties to their default values
     */
    reset: function () {
      this.sessions = [];
      this.activeSessionIdx = -1;
    }

  };

  function Session ($rootScope, $http, $location, deck) {
    this.$rootScope = $rootScope;
    this.$location  = $location;
    this.$http      = $http;

    console.log('deck = ', deck);
    this.deck = deck;

    this.subdeck = null;

    this.options = {
      /** @enum */
      Methods: {
        CLASSIC: 'classic',
        GET100 : 'get100'
      },

      /** @enum */
      FlashcardOrders: {
        CLASSIC: 1,
        HARDEST_TO_EASIEST: 2,
        LEAST_STUDIED: 3,
        WRONGS: 4
      },

      /** @enum */
      Sides: {
        TERM: 'Term',
        DEFINITION: 'Definition',
        RANDOM: 'Random',
        BOTH: 'Both'
      },

      showFirst: deck.show_first,
      method: deck.study_method,
      order: deck.flashcard_order_id  
    };

    this.views = {};
    this.status = {};

    this.index = 0;

    this.complete = false;
    
    if (this.options.method === this.options.Methods.GET100) {
      this.subdeck = {
        index: 0,
        begin: 0,
        end  : Math.min(this.SUBDECK_MAX_LENGTH - 1, deck.flashcards.length - 1),
        indexes: []
      };

      for (var j = 0; j <= this.subdeck.end - this.subdeck.begin; j++) {
        this.subdeck.indexes[j] = this.subdeck.begin + j;
      }
    }
    else {
      this.subdeck = null;
    }

    // event listeners
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
				that.subdeck = null;
			}
		});
  }

	Session.prototype = {

    SUBDECK_MAX_LENGTH: 10,

    addAnswer: function (flashcard, correct) {
      // update status
      if (correct === false) { 
        flashcard.status = -1; 
      }
      else if (flashcard.status === -1 && correct === true) { 
        flashcard.status = 1; 
      }
      else if (flashcard.status < 3) { 
        flashcard.status++; 
      }

      this.status[flashcard.id] = flashcard.status;

      // updates views
      if (this.views[flashcard.id]) { this.views[flashcard.id]++; }
      else { this.views[flashcard.id] = 1; }

      if (flashcard.status === 3 && this.subdeck) { 
        // the flashcard is at 100%, we remove it from the subdeck
        this.subdeck.indexes.splice(this.subdeck.index, 1);
        // we add the next flashcard to the subdeck
        if (this.subdeck.end + 1 < this.deck.flashcards.length) {
          this.subdeck.end++; // increment the index of the subdeck's last flashcard 
          this.subdeck.indexes.push(this.subdeck.end);
        }

        // decrements the index because an index has been removed
        // from subdeck.indexes
        this.subdeck.index--;
      }
      
      this.next();
    },

    next: function () {
      if (!this.subdeck) { // Classic method
        this.index++;
        if (this.index - 1 >= this.deck.flashcards.length - 1) { this.end(); }
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
      
      this.$rootScope.$emit('nextFlashcard');
    },

    updateMethod: function (method) {
      if (this.options.method === method) { return; }

      if (this.options.method) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.deck.id,
          studyMethod: method
        }, { 
          params: {
            action: 'updateStudyMethod'
          }
        });
      }

			if (method === this.options.Methods.GET100) {
				this.subdeck = {
					index: 0,
					begin: this.index,
					end  : Math.min((this.index + this.SUBDECK_MAX_LENGTH - 1), this.deck.flashcards.length - 1),
					indexes: []
				};
				for (var i = 0; i <= this.subdeck.end - this.subdeck.begin; i++) {
					this.subdeck.indexes[i] = this.subdeck.begin + i;
				}
			}
			else {
				this.subdeck = null;
			}
    },

    updateOrder: function (orderId) {
      if (this.options.order === orderId) { return; }

      if (this.options.order) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.deck.id,
          flashcardOrderId: orderId
        }, { 
          params: {
            action: 'updateFlashcardOrder',
          }
        });
      }

      this.options.order = orderId;
    },

    updateShowFirst: function (side) {
      if (this.options.showFirst === side) { return; }

      if (this.options.showFirst) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.deck.id,
          showFirst: side
        }, { 
          params: {
            action: 'updateShowFirst',
          }
        });
      }

      this.options.showFirst = side;
    },

    end: function () {
      this.complete = true;
      this.$rootScope.$emit('sessionEnd');
    }
  };

  function Deck () {}

  Deck.prototype = {
    configure: function (deck) {
      this.deck = deck;
    },

    /**
     * sort
     *
     * @param {number} flashcardOrderId specify the order in which
     *    the flashcards should be displayed, it must be one of 
     *    this.session.options.FlashcardOrders values
     */
    sort: function (flashcardOrderId) {

      /**
       * Used for the 'Hardest to easiest' order
       * @private
       */
      function sortByDifficulty () {
        this.flashcards.sort(function (a, b) {
          if (a.status < b.status) { return -1; }
          else if (a.status > b.status) { return 1;}
          else if (a.status === b.status && a.index < b.index) { return -1; }
          else { return 1; }
        });
      }

      /**
       * Used for the 'Least studied' order
       * @private
       */
      function sortByViews () {
        this.flashcards.sort(function (a, b) {
          if (a.studied < b.studied) { return -1; }
          else if (a.studied > b.studied) { return 1; }
          else if (a.studied === b.studied && a.index < b.index) { return -1; }
          else { return 1; }
        });
      }

      /**
       * Used for the 'Classic' order
       * @private
       */
      function sortByIndex () {
        this.flashcards.sort(function (a, b) {
          if (a.index < b.index) { return -1; }
          else { return 1; }
        });
      }

      var Orders = this.session.options.FlashcardOrders;

      switch (flashcardOrderId) {
        case Orders.CLASSIC           : sortByIndex(); break; 
        case Orders.HARDEST_TO_EASIEST: sortByDifficulty(); break; 
        case Orders.LEAST_STUDIED     : sortByViews(); break; 
        default:
          console.log('unknown order');
        return;
      }

    }
  };

  angular.module('memorizy.deckstudy.SessionManager', []). 
    provider('SessionManager', function () {
    this.$get = [
      '$rootScope',
      '$http',
      '$location',
      function ($rootScope, $http, $location) {
        return new SessionManager($rootScope, $http, $location);
      }
    ];
  });
})();
