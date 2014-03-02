function Flashcard () {}

/**
 * _displayableValue gets the value to be displayed
 * when the corresponding flashcard is displayed
 * and in the flashcard list
 *
 * @private
 * @param {string} value the pre-sanitized value 
 * @param {string} placeholder the string to be
 *    displayed in case `value` is empty or undefined
 * @return {string} the value to be displayed
 */
Flashcard.prototype._displayableValue = function (value, placeholder) {
  if (typeof value === 'string' && value) {
    //- sanitize is used here to prevent users from xss-ing
    //- themselves... and also be able to write html
    //- tags in their flashcards without messing up
    //- the rendering of their page
    return sanitize(value); 
  }
  else {
    return '<i>' + placeholder + '</i>'; 
  }
};

