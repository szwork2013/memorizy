function Flashcard () {
  var _item = null;

  var _term = {
    text: {value: '', selector: null},
    media: {value: '', selector: null}
  },
  _definition = {
    text: {value: '', selector: null},
    media: {value: '', selector: null}
  };

  Object.defineProperty(this, 'item', {
    get: function () {
      return _item;
    },
    set: function (value) {
      _item = value;
      /* set the old item to inactive, if any */
      /* and set the new one to active */
      /* and display the new flashcard content */
    }
  });
  
  Object.defineProperty(this, 'term', {
    get: function () {
      return {
        text: _term.text.value,
        media: _term.media.value
      };
    },
    set: function (value) {
      this._setSide(_term, value);
      _item.term = value;
      /* should update the DOM, and the flashcard item as well */
    }
  });
  Object.defineProperty(this, 'definition', {
    get: function () {
      return {
        text: _definition.text.value,
        media: _definition.media.value
      };
    },
    set: function (value) {
      this._setSide(_definition, value);
      _item.definition = value;
    }
  });

  var _selector = null;
  Object.defineProperty(this, 'selector', {
    get: function () {
      if (!_selector) {
        _selector = $(this._toHtml());
        
        _term.text.selector = _selector.children('.term').children('.text');
        _term.media.selector = _selector.children('.media').children('.text');
        _definition.text.selector = _selector.children('.definition')
                                             .children('.text');
        _definition.media.selector = _selector.children('.media')
                                              .children('.text');
      }
      return _selector;
    }
  });
}

Flashcard.prototype.displayFlashcardItem = function (flashcardItem) {

};

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

Flashcard.prototype._setSide = function (side, value) {
  if (typeof value.text === 'string') {
    side.text.value = value.text;
    if (side.text.selector) {
      side.text.selector.html(value.text);
    }
  }
  if (typeof value.media === 'string') {
    side.media.value = value.media;
    if (side.media.selector) {
      side.media.selector.html(value.media);
    }
  }
};

Flashcard.prototype._getSide = function (side) {
  return {
    text: side.text.value,
    media: side.media.value
  };
};
