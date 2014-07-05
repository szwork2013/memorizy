angular.module('memorizy.encodeURI.encodeURIFilter', [])
.filter('encodeURI', function() {
      return window.encodeURI;
});
