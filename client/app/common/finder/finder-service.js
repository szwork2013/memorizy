(function () {
  'use strict';

  function FinderService ($http) { this.$http = $http; }

  FinderService.prototype.find = function (query) {
    return this.$http.get('/api/finder', {
      params: {
        query: query
      }
    });
  };

  angular.module('memorizy.finder.FinderService', []).
    service('finderService', ['$http', FinderService]);

})();
