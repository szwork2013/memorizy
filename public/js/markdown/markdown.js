(function (angular) {
  'use strict';

  angular.module('memorizy.markdown', []).
    directive('editor', function ($sanitize, $timeout) {
      return {
        restrict: 'A',
        scope: {
          editor: '='
        },
        link: function (scope, element, attrs) {
          var converter = Markdown.getSanitizingConverter();
          var preview = $('#preview-' + attrs.editor);

          element.on('change', function () {
            var markdown = element.val(),
                html = converter.makeHtml(markdown);

            preview.html(html);
          });
          
        }
      };
    })
  .service('markdownConverter', Markdown.getSanitizingConverter);
})(angular);
