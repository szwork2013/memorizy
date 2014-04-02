function escapeHtml(string) {
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };

  return string.replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

function unescapeHtml(string) {
  var entityMap = {
    '&amp;': '&', 
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\'',
    '&#x2F;': '/'
  };

  return string.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g, function (s) {
    return entityMap[s];
  });
}

/**
 * unescapeAllowedTags allows a few html tags for text-style
 *
 * @param {string} string the string to be unescaped
 * @return {string} the string with the allowed tags unescaped
 */
function unescapeAllowedTags (string) {
  string = 
    string.replace(/&lt;span class=&quot;[\s]*italic[\s]*&quot;&gt;(.*?)&lt;&#x2F;span&gt;/g, '<span class="italic">\$1</span>')
      .replace(/&lt;span class=&quot;[\s]*bold[\s]*&quot;&gt;(.*?)&lt;&#x2F;span&gt;/g, '<span class="bold">\$1</span>')
      .replace(/&lt;span class=&quot;[\s]*bold italic[\s]*&quot;&gt;(.*?)&lt;&#x2F;span&gt;/g, '<span class="bold italic">\$1</span>')
      .replace(/&lt;span class=&quot;[\s]*italic[\s]+bold[\s]*&quot;&gt;(.*?)&lt;&#x2F;span&gt;/g, '<span class="italic bold">\$1</span>')
      .replace(/&lt;img(.*?)&gt;/g, '<img\$1>');
  return string;
}

/**
 * sanitize escape all html tags except
 * allowed ones
 *
 * @param {string} string the string to be sanitized
 * @return {string} the sanitized string
 */
function sanitize (string) {
  return unescapeAllowedTags(escapeHtml(string));
}
