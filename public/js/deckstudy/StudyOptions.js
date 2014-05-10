(function () {
  'use strict';

  function StudyOptions ($rootScope, $http, $location) {
		this.$rootScope = $rootScope;
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
      if (_showFirst === side) { return; }

      if (_showFirst) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.session.deck.id,
          showFirst: side
        }, { 
          params: {
            action: 'updateShowFirst',
          }
        });
      }

      _showFirst = side;
      this.$rootScope.$emit('showFirst', side);
    };

    var _updateMethod = function (method) {
      if (_method === method) { return; }

      if (_method) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.session.deck.id,
          studyMethod: method
        }, { 
          params: {
            action: 'updateStudyMethod'
          }
        });
      }

      _method = method;
      this.$rootScope.$emit('method', method);
    };

    var _updateOrder = function (flashcardOrderId) {
      if (_order === flashcardOrderId) { return; }

      if (_order) {
        this.$http.put('/api' + this.$location.path(), { 
          fileId: this.session.deck.id,
          flashcardOrderId: flashcardOrderId
        }, { 
          params: {
            action: 'updateFlashcardOrder',
          }
        });
      }

      _order = flashcardOrderId;
      this.$rootScope.$emit('order', flashcardOrderId);
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
  };

  angular.module('memorizy.deckstudy.StudyOptions', []). 
    provider('studyOptions', function () {
    this.$get = ['$rootScope', '$http', '$location', function ($rootScope, $http, $location) {
      return new StudyOptions($rootScope, $http, $location);
    }];
  });

})();
