(function() {
  'use strict';

  /**
   * @constructor
   * @param $rootScope
   * @param $http
   * @param $location
   * @param {Object} deck
   */
  function Session ($rootScope, socket, $location, deck) {
    this.$rootScope = $rootScope;
    this.$location  = $location;
    this.socket     = socket;

    /**
     * Contain flashcards and information about the deck
     */
    this.deck = {
      id: deck.id,
      flashcards: deck.flashcards
    };

    /**
     * Subdeck is used in get100 mode only and contains
     * the index of the flashcards that are being studied
     */
    this.subdeck = null;

    /**
     * User's config for the associated deck 
     */
    this.config = {
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

    /**
     * Keys are flashcard ids, and values are the number of times
     * the user answered to the flashcard during the session
     */
    this.views = {};

    /**
     * Keys are flashcard ids, and values are the new status of 
     * the flashcard
     */
    this.status = {};

    /**
     * The index of the flashcard being studied
     */
    this.index = 0;

    /**
     * Whether the session has been completed or not,
     * a session is complete if the user has answered
     * to all flashcards once in classic mode, or if
     * all flashcard status are equal to 3 in get100 mode 
     */
    this.complete = false;
    
    if (this.config.method === this.config.Methods.GET100) {
      this.subdeck = {
        index: 0,
        begin: 0,
        end  : Math.min(this.SUBDECK_MAX_LENGTH - 1, this.deck.flashcards.length - 1),
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
			if (method === that.config.Methods.GET100) {
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

    /**
     * The maximum size of a subdeck 
     */
    SUBDECK_MAX_LENGTH: 10,

    /**
     * Update the status of the flashcard
     *
     * @param {Object} flashcard The flashcard that has been answered
     * @param {boolean} correct Whether the answer is correct or not
     */
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

    /**
     * Go to the next flashcard, or end the session
     * if it is complete
     */
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

    /**
     * Update the study method for the associated deck
     * @param {config.Methods} method The method to be used for the associated deck
     */
    setMethod: function (method) {
      if (this.config.method === method) { return; }

      this.socket.emit('deck:studyMethod', {
        id:     this.deck.id,
        method: method
      });

      this.config.method = method;
      
      if (method === this.config.Methods.GET100) {
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

    /**
     * Update the flashcard order for the associated deck
     * @param {config.FlashcardOrders} orderId The order to be used for the associated deck
     */
    setFlashcardOrder: function (orderId) {
      if (this.config.order === orderId) { return; }

      this.socket.emit('deck:flashcardOrder', {
        id:             this.deck.id,
        flashcardOrder: orderId
      });

      this.config.order = orderId;
      this.sortFlashcards(orderId);
    },

    /**
     * sort
     *
     * @param {number} flashcardOrderId specify the order in which
     *    the flashcards should be displayed, it must be one of 
     *    this.session.config.FlashcardOrders values
     */
    sortFlashcards: function (flashcardOrderId) {

      /**
       * Used for the 'Hardest to easiest' order
       * @private
       */
      function sortByDifficulty () {
        this.deck.flashcards.sort(function (a, b) {
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
        this.deck.flashcards.sort(function (a, b) {
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
        this.deck.flashcards.sort(function (a, b) {
          if (a.index < b.index) { return -1; }
          else { return 1; }
        });
      }

      var Orders = this.config.FlashcardOrders;

      switch (flashcardOrderId) {
        case Orders.CLASSIC           : sortByIndex.call(this); break; 
        case Orders.HARDEST_TO_EASIEST: sortByDifficulty.call(this); break; 
        case Orders.LEAST_STUDIED     : sortByViews.call(this); break; 
        default:
          console.log('unknown order');
        return;
      }
    },

    /**
     * Update the flashcard side to show first for the associated deck
     * @param {config.Sides} side The side to show first for the associated deck
     */
    setShowFirst: function (side) {
      if (this.config.showFirst === side) { return; }

      this.socket.emit('deck:showFirst', {
        id:        this.deck.id,
        showFirst: side
      });

      //if (this.config.showFirst) {
        //this.$http.put('/api' + this.$location.path(), { 
          //fileId: this.deck.id,
          //showFirst: side
        //}, { 
          //params: {
            //action: 'updateShowFirst',
          //}
        //});
      //}

      this.config.showFirst = side;
    },

    /**
     * End the session and mark it as complete
     */
    end: function () {
      this.complete = true;
      this.$rootScope.$emit('sessionEnd');
    }
  };

  angular.module('memorizy.deckstudy.StudySession', []).
  factory('studySessionModel', [
    '$rootScope',
    'socketio',
    '$location',
    function($rootScope, socket, $location) {
      return {
        create: function(deck) {
          return new Session($rootScope, socket, $location, deck);
        }
      };
    }
  ]);

})();
