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
        
        var oldVal;

        input.focus(function () { 
          $timeout(function () {
            scope.inputFocused = true; 
          });
        });
        input.blur(function () { 
          $timeout(function () {
            console.log('inputFocused set to false');
            scope.inputFocused = false; 
          });
        });

        input.on('keyup', function (e) {
          var val = input.val();
          if (!val) { 
            $timeout(function () {
              scope.found = []; 
            });
          }
          else if (val !== oldVal) {
            finderService.find(val).success(function (res) {
              scope.found = res;
              if (res.length > 0) {
                scope.selected = res[0].id;
              }
            });
          }

          oldVal = val;
        });
        input.on('keydown', function (e) {
          if (e.keyCode === 38) { // Up
            var prev = suggestions.find('.selected').prev();
            if (prev.length === 0) {
              $timeout(function () { scope.selected = null; });
            }
            else {
              $timeout(function () { 
                scope.selected = prev.data('file-id');
              });
            }
          }
          else if (e.keyCode === 40) { // Down
            var next = suggestions.find('.selected').next();
            if (next.length === 0) {
              $timeout(function () { scope.selected = null; });
            }
            else {
              $timeout(function () { 
                scope.selected = next.data('file-id');
              });
            }
          }
          else if (e.keyCode === 13) {
            var path = '/' + suggestions.find('.selected .path')
                                        .text().trim();
            if (e.altKey) {
              path += '?action=edit';
            }

            var that = $(this);
            $timeout(function () {
              $location.url(path);
            });
          }
        });

        suggestions.on('mouseover', '.suggestion', function () {
          var that = $(this);
          $timeout(function () {
            scope.selected = 
              parseInt(that.data('file-id'), 10);
          });
        });
        suggestions.on('click', '.suggestion', function () {
          var that = $(this);
          $timeout(function () {
            $location.path('/' + that.find('.path').text().trim());
          });
        });

        scope.$on('$locationChangeStart', function () {
          input.val('');
        });

        input.focus();
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
