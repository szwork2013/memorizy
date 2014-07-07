(function () {
  'use strict';

  function FinderController (cssInjector) {
    cssInjector.add('/css/common/finder/finder.css');
  }

  angular.module('memorizy.finder.FinderController', []).
    controller('finderController', ['cssInjector', FinderController]);

})();
