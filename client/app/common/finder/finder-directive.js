(function () {
  'use strict';

  function FinderDirective ($timeout, $location, finderService) {
    return {
      restrict: 'E',
      scope: {
        title: '='
      },
      link: function (scope, element, attrs) {
        var input = element.find('input'),
            suggestions = element.find('.suggestions');
        
        input.on('keyup', function (e) {
          var val = input.val();
          if (!val) { 
            $timeout(function () {
              scope.found = []; 
            });
          }
          else {
            finderService.find(val).success(function (res) {
              scope.found = res;
            });
          }
        });

        suggestions.on('mouseover', '.suggestion', function () {
          $(this).addClass('selected'); 
        });
        suggestions.on('mouseleave', '.suggestion', function () {
          $(this).removeClass('selected'); 
        });
        suggestions.on('click', '.suggestion', function () {
          var that = $(this);
          $timeout(function () {
            $location.path('/' + that.find('.path').text().trim());
          });
        });

      },
      templateUrl: '/partials/common/finder/finder'
    };
  }

  angular.module('memorizy.finder.FinderDirective', []).
    directive('finder', [
      '$timeout', 
      '$location',
      'finderService',
      FinderDirective
    ]);

})();
