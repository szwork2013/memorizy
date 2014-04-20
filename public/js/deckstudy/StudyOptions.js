(function () {
  'use strict';

  function StudyOptions ($http, $location) {
    this.$http = $http;
    this.$location = $location;

    this.session = null;

    var _showFirst = null,
        _method    = null,
        _order     = null;
    
    var that = this;
    Object.defineProperties(StudyOptions.prototype, {
      showFirst: {
        get: function () { return _showFirst; },
        set: function (side) {
          _updateShowFirst.call(that, side);
        }
      },
      method: {
        get: function () { return _method; },
        set: function (method) {
          _updateMethod.call(that, method);
        }
      },
      order: {
        get: function () { return _order; },
        set: function (orderId) {
          _updateOrder.call(that, orderId);
        }
      },
    });

    var _updateShowFirst = function (side) {
      _showFirst = side;
      return this.$http.put('/api' + this.$location.path(), { 
        fileId: this.session.deck.id,
        showFirst: side
      }, { 
        params: {
          action: 'updateShowFirst',
        }
      });
    };

    var _updateMethod = function (method) {
      _method = method;

      return this.$http.put('/api' + this.$location.path(), { 
        fileId: this.session.deck.id,
        studyMethod: method
      }, { 
        params: {
          action: 'updateStudyMethod'
        }
      });
    };

    var _updateOrder = function (flashcardOrderId) {
      _order = flashcardOrderId;
      return this.$http.put('/api' + this.$location.path(), { 
        fileId: this.session.deck.id,
        flashcardOrderId: flashcardOrderId
      }, { 
        params: {
          action: 'updateFlashcardOrder',
        }
      });
    };
  }


  /** @enum */
  StudyOptions.prototype.Methods = {
    CLASSIC: 'classic',
    GET100 : 'get100'
  };

  /** @enum */
  StudyOptions.prototype.FlashcardOrders = {
    CLASSIC: 1,
    HARDEST_TO_EASIEST: 2,
    LEAST_STUDIED: 3,
    WRONGS: 4
  };

  /** @enum */
  StudyOptions.prototype.Sides = {
    TERM: 'Term',
    DEFINITION: 'Definition',
    RANDOM: 'Random',
    BOTH: 'Both'
  };

  StudyOptions.prototype.configure = function (session, config) {
    this.session = session;
    this.showFirst = config.showFirst || this.Sides.TERM;
    this.method = config.method || this.Methods.CLASSIC;
    this.order = config.order || this.FlashcardOrders.CLASSIC;
    this.subdeckSize = 10; // used only in get100 mode
  };

  angular.module('memorizy.deckstudy.StudyOptions', []). 
    provider('studyOptions', function () {
    this.$get = ['$http', '$location', function ($http, $location) {
      return new StudyOptions($http, $location);
    }];
  });

})();
