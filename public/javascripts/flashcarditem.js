/**
 * FlashcardItem
 *
 * @constructor
 */
function FlashcardItem (flashcard) {
  this.id = flashcard ? flashcard.id : null;
  var _term, _definition;

  if (!flashcard) {
    _term = {
      text: {value: '', selector: null},
      media: {value: '', selector: null}
    };
    _definition = {
      text: {value: '', selector: null},
      media: {value: '', selector: null}
    };
  }
  else {
    _term = {
      text: {value: flashcard.termText, selector: null},
      media: {value: flashcard.termMedia, selector: null}
    };
    _definition = {
      text: {value: flashcard.definitionText, selector: null},
      media: {value: flashcard.definitionMedia, selector: null}
    };
  }

  Object.defineProperty(this, 'term', {
    get: function () {
      return this._getSide(_term);
    },
    set: function (value) {
      this._setSide(_term, value);
    }
  });
  Object.defineProperty(this, 'definition', {
    get: function () {
      return this._getSide(_definition);
    },
    set: function (value) {
      this._setSide(_definition, value);
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

FlashcardItem.prototype._toHtml = function () {
  return '' +
    '<a class="flashcard-item list-group-item" href="#">' +
      '<div class="list-group-item-heading term">' +
        '<div class="media"></div>' +
        '<div class="text">' +
          this.term.text + 
        '</div>' +
      '</div>' +
      '<div class="list-group-item-text definition">' +
        '<div class="media"></div>' +
        '<div class="text">' +
          this.definition.text +
        '</div>' +
      '</div>' +
      '<span class="btn-delete glyphicon glyphicon-remove"></span>' +
    '</a>';
};

FlashcardItem.prototype._setSide = function (side, value) {
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

FlashcardItem.prototype._getSide = function (side) {
  return {
    text: side.text.value,
    media: side.media.value
  };
};
