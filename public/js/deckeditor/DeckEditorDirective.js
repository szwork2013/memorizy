(function () {
  'use strict';

  angular.module('memorizy.deckeditor.DeckEditorDirective', []).
    directive('side', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.mouseenter(function (e) {
          console.log('mouseenter');
          element.find('.btn-image').show();          
        });
        element.mouseleave(function (e) {
          element.find('.btn-image').hide();          
        });
      }
    };  
  });
})();
