(function () {
  'use strict';

  function FinderDirective ($localStorage) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        console.log('element = ', element);
        var engine = new Bloodhound({
          local: [{name: 'test'}],
          remote: {
            ajax: {
              headers: {
                Authorization: 'Bearer ' + $localStorage.token
              }
            },
            url: '/api/finder?q=%QUERY'
          },
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
          queryTokenizer: Bloodhound.tokenizers.whitespace
        });

        engine.initialize();

        element.typeahead(null, {
          name: 'found',
          displayKey: 'name',
          source: engine.ttAdapter()
        });
      }
    };
  }

  angular.module('memorizy.finder.FinderDirective', []).
    directive('finder', ['$localStorage', FinderDirective]);
})();
