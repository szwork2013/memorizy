function StudyOptions ($http, $location) {
  this.$http = $http;
  this.$location = $location;
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
  this.index = 0;
};

StudyOptions.prototype.updateFlashcardOrder = function (flashcardOrderId) {
  this.order = flashcardOrderId;
  return this.$http.put('/api' + this.$location.path(), { 
    fileId: this.session.deck.id,
    flashcardOrderId: flashcardOrderId
  }, { 
    params: {
      action: 'updateFlashcardOrder',
    }
  });
};

StudyOptions.prototype.updateMethod = function (method) {
  this.method = method;

  return this.$http.put('/api' + this.$location.path(), { 
    fileId: this.session.deck.id,
    studyMethod: method
  }, { 
    params: {
      action: 'updateStudyMethod'
    }
  });
};

StudyOptions.prototype.updateShowFirst = function (side) {
  this.showFirst = side;

  return this.$http.put('/api' + this.$location.path(), { 
    fileId: this.session.deck.id,
    showFirst: side
  }, { 
    params: {
      action: 'updateShowFirst',
    }
  });
};

angular.module('memorizy.deckstudy.StudyOptions', []). 
  provider('studyOptions', function () {
  this.$get = ['$http', '$location', function ($http, $location) {
    return new StudyOptions($http, $location);
  }];
});

