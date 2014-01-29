/*
 * Dependencies:
 *
 * jQuery
 * socket.io
 * html-sanitizer
 */

var socket = io.connect();

/*
 * Caches main jQuery selectors
 */
var flashcardList = $('#list-flashcards'),
    selectedFlashcard = null,
    term = $('#flashcard > .term'),
    definition = $('#flashcard > .definition'),
    arrowPrevious = $('#arrow-previous'),
    arrowNext = $('#arrow-next');

/**
 * initializeFlashcardList pushes every flashcard
 * in the flashcard list
 *
 * @param {Array.<Object>} flashcards
 */
function initializeFlashcardList (flashcards) {
  if (!flashcards) {
    return;
  }

  var node = '';
  flashcards.forEach(function (flashcard, index, array) {
    // HTML sanitization is done on client side,
    // and a placeholder is displayed if the flashcard's
    // term or definition is empty
    flashcard.term = flashcard.term ? 
                     sanitize(flashcard.term) :
                     '<i>' + term.data('placeholder') + '</i>';

    flashcard.definition = flashcard.definition ? 
                           sanitize(flashcard.definition) :
                           '<i>' + definition.data('placeholder') + '</i>';

    // TODO: Find a way to add dynamic HTML without having
    // to write an ugly code like the one below
    node += '' + 
      '<a class="flashcard-item list-group-item" href="#"' +  
      'data-flashcard-id="' + flashcard.id + '">' +
        '<h5 class="list-group-item-heading term">' + 
          flashcard.term + 
        '</h5>' +
        '<p class="list-group-item-text definition">' + 
          flashcard.definition + 
        '</p>' +
        '<span class="btn-delete glyphicon glyphicon-remove"></span>' +
      '</a>';
  });
  flashcardList.append(node);
}  

/**
 * DeckEditor
 *
 * @constructor
 * @param {number} deckId
 */
function DeckEditor (deckId) {
  this.id = deckId;
}

/**
 * saveFlashcard updates flashcard's fields on the
 * flashcard list and send changes to the server
 *
 * @param {Object} flashcard the jQuery selector which
 * correspond to the flashcard item in the flashcard list
 */
DeckEditor.prototype.saveFlashcard = function (flashcard) {
  if (!flashcard || (typeof flashcard.data('flashcard-id') !== 'number' &&
    typeof flashcard.prev('a.list-group-item') === 'undefined')) {
    console.error('The flashcard you\'re trying to save is invalid');
    return;
  }

  var obj = {};

  // Update flashcard list
  obj.term = this.applyModifications(term, flashcard.children('.term'),
                                     term.data('placeholder'));
  obj.definition = this.applyModifications(definition, 
                                           flashcard.children('.definition'),
                                           definition.data('placeholder'));

  //- No modification to send
  if (typeof obj.term === 'undefined' &&
      typeof obj.definition === 'undefined') {
    return;
  }

  if (typeof flashcard.data('flashcard-id') === 'number') {
    obj.id = flashcard.data('flashcard-id');
  }

  obj.deckId = this.id;

  // Update remote server
  socket.emit('saveFlashcard', obj);
};

/**
 * displayableValue gets the value to be displayed
 * when the corresponding flashcard is displayed
 * and in the flashcard list
 *
 * @param {string} value the pre-sanitized value 
 * @param {string} placeholder the string to be
 *    displayed in case `value` is empty or undefined
 * @return {string} the value to be displayed
 */
DeckEditor.prototype.displayableValue = function (value, placeholder) {
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

/**
 * applyModifications copy the html content from src
 * to dest, if their content differ
 *
 * @param {Object} src the jQuery selector corresponding
 *    to the source element
 * @param {Object} dest the jQuery selector corresponding
 *    to the destination element
 * @param {string} placeholder the value to copy in case
 *    the source content is empty
 * @return {string} the new value which should be sent 
 *    to the remote server, will be an empty string if
 *    the placeholder is displayed
 */
DeckEditor.prototype.applyModifications = function (src, dest, placeholder) {
  if (src === dest) {
    return;
  } 
  var newValue = (src.html() !== '<i>'+ placeholder +'</i>') ?
                unescapeHtml(src.html()) : ''; 
  dest.html(this.displayableValue(newValue, placeholder));

  return newValue;
};

DeckEditor.prototype.moveFlashcard = function (id, beforeId) {
  if (typeof id !== 'number' || typeof beforeId !== 'number') {
    return;
  }

  socket.emit('moveFlashcard', {
    flashcardId: id,
    beforeId: beforeId
  });
};

DeckEditor.prototype.deleteFlashcard = function (id) {
  if (typeof id !== 'number') {
    return;
  }

  socket.emit('deleteFlashcard', {flashcardId: id});
};

/**
 * goTo saves currently displayed flashcard changes
 * and display the flashcard given as argument
 *
 * @param {Object} flashcard the jQuery selector corresponding
 * to the flashcard list item of the flashcard to display
 */
DeckEditor.prototype.goTo = function (flashcard) {
  // show placeholder if fields are empty, so that
  // other functions don't have to consider 2
  // possibilities, the one where a field is empty,
  // and the other where the field contains the
  // placeholder
  term.blur();
  definition.blur();

  //- Nothing to save if there's no flashcard
  //- in the deck or if no flashcard has been
  //- selected yet
  if (selectedFlashcard) {
    this.saveFlashcard(selectedFlashcard);
  }
  this.displayFlashcard(flashcard);
};

/**
 * createFlashcard add an item at the end
 * of the flashcard list
 */
DeckEditor.prototype.createFlashcard = function () {
  // TODO: Find a prettier way to add dynamic HTML
  // than the ugly thing below
  var item = '' +
    '<a class="flashcard-item list-group-item" href="#">' +
      '<h5 class="list-group-item-heading term">' +
        '<i>' + term.data('placeholder') + '</i>' +
      '</h5>' +
      '<p class="list-group-item-text definition">' +
        '<i>' + definition.data('placeholder') + '</i>' +
      '</p>' +
    '</a>';

  return $(item);
};

/**
 * displayFlashcard
 *
 * @param {Object} flashcard the jQuery selector corresponding
 *    to the flashcard list item of theflashcard to be displayed
 */
DeckEditor.prototype.displayFlashcard = function (flashcard) {
  //- If the flashcard already exists
  //- flashcard.length corresponds to the number of node
  //- contained in the flashcard jquery object
  if (typeof flashcard !== 'undefined' && flashcard.length > 0) {
    if (selectedFlashcard) {
      selectedFlashcard.removeClass('active');
    }

    term.html(flashcard.children('.term').html());
    definition.html(flashcard.children('.definition').html());

    flashcard.addClass('active');
    selectedFlashcard = flashcard;
  }
  //- If the flashcard does not exist yet, there's
  //- two possibilities: the deck is empty, or
  //- we want to display the flashcard after the
  //- deck's last flashcard
  //- In the first case, selectedFlashcart isn't set
  //- and in the second case it is set to the last
  //- flashcard
  else if (!selectedFlashcard ||
    selectedFlashcard.get(0) === flashcardList.children().last().get(0)) {

    if (selectedFlashcard) {
      selectedFlashcard.removeClass('active');
    }

    var createdFlashcard = this.createFlashcard(); 
    createdFlashcard.appendTo(flashcardList);

    term.html('');
    definition.html('');

    createdFlashcard.addClass('active');
    selectedFlashcard = createdFlashcard;
  }

  definition.blur(); // show the placeholder if definition is empty
  term.focus();
};

/**
 * goToPreviousFlashcard
 */
DeckEditor.prototype.goToPreviousFlashcard = function () {
  this.goTo(selectedFlashcard.prev('.flashcard-item'));
};

/**
 * goToNextFlashcard
 */
DeckEditor.prototype.goToNextFlashcard = function () {
  this.goTo(selectedFlashcard.next('.flashcard-item'));
};

var editingEnv = {
  setDeckEditor : function (deckEditor) {
    // Display the first flashcard on page load
    deckEditor.goTo(flashcardList.find('a.list-group-item').first());

    /*
     * Event handlers configuration
     */

    $('#btn-bold').click(function () {
      boldApplier.toggleSelection();
    });

    $('#btn-italic').click(function () {
      italicApplier.toggleSelection();
    });

    term.keydown(function (e) {
      // SHIFT + TAB
      if (e.shiftKey && e.which === 9) {
        deckEditor.goToPreviousFlashcard();
        e.preventDefault(); 
      }
    });

    definition.keydown(function (e) {
      // SHIFT without TAB
      if (!e.shiftKey && e.which === 9) {
        deckEditor.goToNextFlashcard();
        e.preventDefault(); // prevent from focusing URL bar
      }
    });

    //arrowPrevious.click(deck.goToPreviousFlashcard);
    //arrowNext.click(deck.goToNextFlashcard);

    // Display a flashcard when a user click on it on the
    // flashcard list
    flashcardList.on('click', '.flashcard-item', function (e) {
      deckEditor.goTo($(this));
    });

    flashcardList.on('mouseenter', '.flashcard-item', function (e) {
      $(this).children('.btn-delete').css('visibility', 'visible');
    });

    flashcardList.on('mouseleave', '.flashcard-item', function (e) {
      $(this).children('.btn-delete').css('visibility', 'hidden');
    });

    flashcardList.on('click', '.btn-delete', function (e) {
      var parent = $(this).parent();
      socket.emit('deleteFlashcard', { 
        id: parent.data('flashcard-id')
      });

      if (parent.hasClass('active')) {
        deckEditor.displayFlashcard(parent.next('.flashcard-item'));
      }

      parent.remove();

      return false;
    });

    //- Simulate a placeholder on flashcard term and
    //- definition which show 'Term' and 'Definition'
    //- if the term or the definition is empty
    $('[data-placeholder]').focus(function() {
      var input = $(this);
      if (input.html() === '<i>' + input.data('placeholder') + '</i>') {
        input.html('');
        input.removeClass('placeholder');
      }
    }).blur(function() {
      var input = $(this);
      if (input.text() === '' || 
          input.html() === '<i>' + input.data('placeholder') + '</i>') {

        input.addClass('placeholder');
        input.html('<i>' + input.data('placeholder') + '</i>');
      }
      // Remove <br> tag added by firefox more or less randomly
      // (see https://bugzilla.mozilla.org/show_bug.cgi?id=930432)
      else {
        $(this).find('br').remove();
      }
    });
  }
};
