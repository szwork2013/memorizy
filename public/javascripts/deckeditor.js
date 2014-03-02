var socket = io.connect();

function showUploadForm () {
  this.media.children('.upload-form').show();
}
function hideUploadForm () {
  this.media.children('.upload-form').hide();
}
function showMediaCanvas () {
  this.media.children('.media-canvas').show();
}
function hideMediaCanvas () {
  this.media.children('.media-canvas').hide();
}

/*
 * Caches main jQuery selectors
 */
var flashcardList = $('#list-flashcards'),
    selectedFlashcard = null,
    term = {
      selector: $('#flashcard > .term'),
      text    : $('#flashcard > .term > .text'),
      media   : $('#flashcard > .term > .media'),
      mediaInput: $('<input type="file">'),
      showUploadForm: function () {
        showUploadForm.call(this);
      },
      hideUploadForm: function () {
        hideUploadForm.call(this);
      },
      showMediaCanvas: function () {
        showMediaCanvas.call(this);
      },
      hideMediaCanvas: function () {
        showMediaCanvas.call(this);
      }
    },
    definition = {
      selector: $('#flashcard > .definition'),
      text    : $('#flashcard > .definition > .text'),
      media   : $('#flashcard > .definition > .media'),
      mediaInput: $('<input type="file">'),
      showUploadForm: function () {
        showUploadForm.call(this);
      },
      hideUploadForm: function () {
        hideUploadForm.call(this);
      },
      showMediaCanvas: function () {
        showMediaCanvas.call(this);
      },
      hideMediaCanvas: function () {
        showMediaCanvas.call(this);
      }
    },
    arrowPrev = $('#arrow-prev'),
    arrowNext = $('#arrow-next');

/**
 * Contains all constants that might be used
 * by .data() jQuery method
 *
 * @private
 * @enum {string}
 */
var _Data = {
  FLASHCARD_ID: 'flashcard-id',
  LOCAL_ID    : 'local-id',
  PLACEHOLDER : 'placeholder',
  LOCKED      : 'locked',
  DELETED     : 'deleted',
  MOVED_TO    : 'moved-to'
};

/**
 * Contains all event names used with socket.io 
 *
 * @private
 * @enum {string}
 */
var _Event = {
  SAVE_FLASHCARD   : 'saveFlashcard',
  DELETE_FLASHCARD : 'deleteFlashcard',
  MOVE_FLASHCARD   : 'moveFlashcard',
  COPY_FLASHCARD   : 'copyFlashcard',

  FLASHCARD_SAVED  : 'flashcardSaved',
  FLASHCARD_DELETED: 'flashcardDeleted',
  FLASHCARD_MOVED  : 'flashcardMoved',
  FLASHCARD_COPIED : 'flashcardCopied',

  SAVE_FLASHCARD_ERROR   : 'saveFlashcardError',
  DELETE_FLASHCARD_ERROR : 'deleteFlashcardError',
  MOVE_FLASHCARD_ERROR   : 'moveFlashcardError',
  COPY_FLASHCARD_ERROR   : 'copyFlashcardError'
};

/**
 * Used to give new flashcards a temporary 
 * id while they're waiting for the one they
 * have in the database once they have been saved
 * 
 * @type {number}
 * @private
 */
var _localId = 0;

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
 * _flashcardItemHtml
 *
 * @param {Object} flashcard The flashcard object to make an
 *    item with
 * @return {string} The corresponding flashcard item html
 */
DeckEditor.prototype._flashcardItemHtml = function (flashcard) {
  // HTML sanitization is done on client side,
  // and a placeholder is displayed if the flashcard's
  // term or definition is empty
  flashcard.term_text = this._displayableValue(
    flashcard.term_text, term.text.data(_Data.PLACEHOLDER)
  );
  flashcard.definition_text = this._displayableValue(
    flashcard.definition_text, definition.text.data(_Data.PLACEHOLDER)
  );

  var dataTermMediaId = '',
      dataDefinitionMediaId = '',
      termMediaHtml = '',
      definitionMediaHtml = '';

  if (flashcard.term_media_id) {
    dataTermMediaId = 'data-media-id="' + flashcard.term_media_id + '"';
    termMediaHtml = this._mediaThumbnailHtml(flashcard.term_media_id);
  }
  if (flashcard.definition_media_id) {
    dataDefinitionMediaId = 
      'data-media-id="' + flashcard.definition_media_id+'"';
    definitionMediaHtml = 
      this._mediaThumbnailHtml(flashcard.definition_media_id);
  }

  return '' +
    '<a class="flashcard-item list-group-item" href="#"' +  
    'data-flashcard-id="' + flashcard.id + '">' +
      '<div class="list-group-item-heading term">' + 
        '<div class="media media-thumbnail" ' + dataTermMediaId + '>' + 
          termMediaHtml +
        '</div>' +
        '<div class="text">' + flashcard.term_text + '</div>' +
      '</div>' +
      '<div class="list-group-item-text definition">' + 
        '<div class="media media-thumbnail" ' + dataDefinitionMediaId + '>' + 
          definitionMediaHtml + 
        '</div>' +
        '<div class="text">' + flashcard.definition_text + '</div>' +
      '</div>' +
      '<span class="btn-delete glyphicon glyphicon-remove"></span>' +
    '</a>';
};

/**
 * initializeFlashcardList pushes every flashcard
 * on the flashcard list
 *
 * @param {Array.<Object>} flashcards
 */
DeckEditor.prototype.initializeFlashcardList = function (flashcards) {
  if (!flashcards) {
    return;
  }

  var node = '';
  var that = this;

  flashcards.forEach(function (flashcard, index, array) {
    node += that._flashcardItemHtml(flashcard);
  });
  flashcardList.append(node);
}; 

/**
 * saveFlashcard updates flashcard's fields on the
 * flashcard list and send changes to the server
 *
 * @param {FlashcardItem} flashcardItem the flashcard 
 *    item which must be updated
 * @return {FlashcardItem} the updated flashcardItem
 */
DeckEditor.prototype.saveFlashcard = function (flashcardItem) {
  var updates = {};
  var newFlashcardItem = flashcardItem;

  // Update flashcard list
  updates.term = this._applyModifications(
    term, flashcardItem.term, term.text.data(_Data.PLACEHOLDER)
  );
  updates.definition = this._applyModifications(
    definition, flashcardItem.definition, 
    definition.text.data(_Data.PLACEHOLDER)
  );

  var termUpdates = !($.isEmptyObject(updates.term));
  var definitionUpdates = !($.isEmptyObject(updates.definition));
  //- No modification to send
  if (!termUpdates && !definitionUpdates) {
    return;
  }

  updates.deckId = this.id;

  // The flashcard already has an id in
  // the database
  if (typeof flashcardItem.id === 'number') {
    updates.id = flashcardItem.id;

    // Update remote server
    socket.emit(_Event.SAVE_FLASHCARD, updates);
  }
  else {
    flashcardItem.selector.data(_Data.LOCAL_ID, _localId);
    updates.localId = _localId;
    _localId++;

    var next = new FlashcardItem(
      flashcardItem.selector.next('.flashcard-item')
    );

    if (!next.exists()) {
      var prev = new FlashcardItem(
        flashcardItem.selector.prev('.flashcard-item')
      );

      // the flashcard is the only one to be waiting
      // for an id at the end of the deck or
      // the deck is empty, so the flashcard
      // is simply appended to the deck
      if (typeof prev.id !== 'undefined' || !prev.exists()) {
        socket.emit(_Event.SAVE_FLASHCARD, updates);
      }
      //else {
      // Another flashcard is already being appended
      // to the end of the deck, so we must wait
      // for its id
      //}
    }
    // if there is other flashcards after the one
    // being saved, the successor's id is needed
    else if (typeof next.id !== 'undefined'){
      updates.nextId = next.id; 
      // Prevent the successor to be
      // moved or deleted while its
      // current predecessors are waiting
      // for an id
      this._lock(next.selector);
      socket.emit(_Event.SAVE_FLASHCARD, updates);
    }
    //else {
    //the flashcard must wait its successor
    //which is being saved to get its id
    //in order to be saved. if there are several
    //flashcards which are waiting for the
    //same successor, then they are sent together
    //once the successor gets its id
    //}
  }

  if (termUpdates) {
    newFlashcardItem.term = updates.term;
  }
  if (definitionUpdates) {
    newFlashcardItem.definition = updates.definition;
  }

  return newFlashcardItem;
};


/**
 * _applyModifications copy the html content from src
 * to dest, if their content differ
 *
 * @private
 * @param {FlashcardItem} src the FlashcardItem corresponding
 *    to the source element
 * @param {FlashcardItem} dest the FlashcardItem corresponding
 *    to the destination element
 * @param {string} placeholder the value to copy in case
 *    the source content is empty
 * @return {string} the new value which should be sent 
 *    to the remote server, will be an empty string if
 *    the placeholder is displayed, and null if there
 *    is no difference between src and dest content
 */
DeckEditor.prototype._applyModifications = function (src, dest, placeholder) {
  if (src.selector.html() === dest.selector.html()) {
    return {};
  } 

  var modifs = {};

  if (src.text.html() !== dest.text.html()) {
    modifs.text = (src.text.html() !== '<i>'+ placeholder +'</i>') ?
      unescapeHtml(src.text.html()) : ''; 
    dest.text.html(this._displayableValue(modifs.text, placeholder));
  }

  if (src.media.data('media-id') !== dest.media.data('media-id')) {
    modifs.media = {};

    modifs.media.id = src.selector.data('media-id');

    var canvas = dest.media.children('canvas');
    if (canvas.length <= 0) {
      canvas = dest.media.prepend('<canvas class="media-canvas">');
    }
    
    this._canvasToFile(src.media.children('.media-canvas').get(0));
    this.drawMedia(canvas, media, _MEDIA.THUMBNAIL.MAX_WIDTH, 
                   _MEDIA.THUMBNAIL.MAX_HEIGHT);
  }

  return modifs;
};

/**
 * _lock prevents a flashcard from being deleted or moved by
 * modifying its selector's DOM node data attribute
 *
 * @private
 * @param {Object} flashcardItemSelector the jQuery selector corresponding
 *    to the flashcard to lock
 */
DeckEditor.prototype._lock = function (flashcardItemSelector) {
  flashcardItemSelector.data(_Data.LOCKED, 1);  
  console.log('Lock flashcard ' + 
              flashcardItemSelector.data(_Data.FLASHCARD_ID));
};

/**
 * _unlock allows a flashcard to be moved or deleted and execute actions
 * triggered while the flashcard was locked. If the flashcard has been
 * deleted while it was locked, other actions will be ignored
 *
 * @private
 * @param {Object} flashcardItemSelector the jQuery selector corresponding
 *    to the flashcard to lock
 */
DeckEditor.prototype._unlock = function (flashcardItemSelector) {
  flashcardItemSelector.removeData(_Data.LOCKED);  

  console.log('Unlock flashcard ' + 
              flashcardItemSelector.data(_Data.FLASHCARD_ID));

  var deleted = flashcardItemSelector.data(_Data.DELETED);

  if (typeof deleted !== 'undefined') {
    flashcardItemSelector.removeData(_Data.DELETED);
    console.log('\tDeleted');
    this.deleteFlashcard(new FlashcardItem(flashcardItemSelector));
    return;
  }
  // TODO: Use node object instead of data
  var movedBefore = flashcardItemSelector.data(_Data.MOVED_BEFORE);
  if (typeof movedTo !== 'undefined') {
    flashcardItemSelector.removeData(_Data.MOVED_TO);
    console.log('\tMoved before ' + movedBefore);
    this.moveFlashcard(new FlashcardItem(flashcardItemSelector), movedTo);
    return;
  }
};

DeckEditor.prototype.moveFlashcard = function (id, beforeId) {
  if (typeof id !== 'number' || typeof beforeId !== 'number') {
    return;
  }

  // TODO: Check if the flashcard is not locked

  socket.emit(_Event.MOVE_FLASHCARD, {
    flashcardId: id,
    beforeId: beforeId
  });
};

/**
 * deleteFlashcard
 *
 * @param {FlashcardItem} flashcardItem
 */
DeckEditor.prototype.deleteFlashcard = function (flashcardItem) {
  if (flashcardItem.selector.hasClass('active')) {
    deckEditor.displayFlashcard(
      new FlashcardItem(flashcardItem.selector.next('.flashcard-item'))
    );
  }

  flashcardItem.selector.remove();

  if (typeof flashcardItem.id !== 'number') {
    return;
  }

  // TODO: Check if the flashcard is not locked
  // TODO: If the flashcard has a local id, then
  // wait for it to have a real id

  socket.emit(_Event.DELETE_FLASHCARD, { 
    id: flashcardItem.id
  });
};

/**
 * goTo saves currently displayed flashcard changes
 * and display the flashcard given as argument
 *
 * @param {FlashcardItem} flashcard the flashcard
 *    to be displayed
 */
DeckEditor.prototype.goTo = function (flashcard) {
  // show placeholder if fields are empty, so that
  // other functions don't have to consider 2
  // possibilities, the one where a field is empty,
  // and the other where the field contains the
  // placeholder
  term.text.blur();
  definition.text.blur();

  //- Nothing to save if there's no flashcard
  //- in the deck or if no flashcard has been
  //- selected yet
  if (selectedFlashcard) {
    this.saveFlashcard(selectedFlashcard);
  }
  this.displayFlashcard(flashcard);
};

/**
 * displayFlashcard
 *
 * @param {FlashcardItem} flashcard 
 */
DeckEditor.prototype.displayFlashcard = function (flashcard) {
  //- If the flashcard already exists
  //- TODO: Find a better way to determine whether
  //- the flashcard already exist than testing its term
  if (typeof flashcard.term !== 'undefined') {
    if (selectedFlashcard) {
      selectedFlashcard.selector.removeClass('active');
    }

    var mediaHtml = {
      term: flashcard.term.media.html(),
      definition: flashcard.definition.media.html()
    };

    term.text.html(flashcard.term.text.html());
    /*
     *term.media.html(mediaHtml.term)
     *  .removeClass('media-thumbnail')
     *  .addClass('media-halfsize');
     */

    definition.text.html(flashcard.definition.text.html());
    /*
     *definition.media.html(mediaHtml.definition)
     *  .removeClass('media-thumbnail')
     *  .addClass('media-halfsize');
     */

    flashcard.selector.addClass('active');
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
           selectedFlashcard.selector.get(0) === 
             flashcardList.children().last().get(0)) {
    console.log('does not exist yet');
  if (selectedFlashcard) {
    selectedFlashcard.selector.removeClass('active');
  }

  var createdFlashcard = this.createFlashcard(); 
  createdFlashcard.selector.appendTo(flashcardList);

  term.text.html('');
  definition.text.html('');

  createdFlashcard.selector.addClass('active');
  selectedFlashcard = createdFlashcard;
  }

  definition.text.blur(); // show the placeholder if definition is empty
  term.text.focus();
};

/**
 * goToPreviousFlashcard
 */
DeckEditor.prototype.goToPreviousFlashcard = function () {
  var prev = selectedFlashcard.selector.prev('.flashcard-item');
  if (prev.length > 0) {
    this.goTo(new FlashcardItem(prev));
  }
};

/**
 * goToNextFlashcard
 */
DeckEditor.prototype.goToNextFlashcard = function () {
  var next = selectedFlashcard.selector.next('.flashcard-item');
  console.log('goToNextFlashcard go to ' + next);
  this.goTo(new FlashcardItem(next));
};

$('#btn-bold').click(function () {
  boldApplier.toggleSelection();
});

$('#btn-italic').click(function () {
  italicApplier.toggleSelection();
});

var editingEnv = {
  setDeckEditor : function (deckEditor) {
    // Display the first flashcard on page load
    deckEditor.goTo(new FlashcardItem(
      flashcardList.find('.flashcard-item').first()
    ));

    /*
     * Event handlers configuration
     */

    term.selector.keydown(function (e) {
      // SHIFT + TAB
      if (e.shiftKey && e.which === 9) {
        deckEditor.goToPreviousFlashcard();
        e.preventDefault(); 
      }
    });

    definition.selector.keydown(function (e) {
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
      deckEditor.goTo(new FlashcardItem($(this)));
    });

    flashcardList.on('mouseenter', '.flashcard-item', function (e) {
      $(this).children('.btn-delete').css('visibility', 'visible');
    });

    flashcardList.on('mouseleave', '.flashcard-item', function (e) {
      $(this).children('.btn-delete').css('visibility', 'hidden');
    });

    flashcardList.on('click', '.btn-delete', function (e) {
      var parent = new FlashcardItem($(this).parent());
      deckEditor.deleteFlashcard(parent);

      return false;
    });

    //- Simulate a placeholder on flashcard term and
    //- definition which shows 'Term' and 'Definition'
    //- if the term or the definition is empty
    $('#flashcard .text').focus(function() {
      var input = $(this);
      if (input.html() === '<i>' + $(this).data(_Data.PLACEHOLDER) + '</i>') {
        $(this).removeClass(_Data.PLACEHOLDER);
        input.html('');
      }
      return false;
    }).blur(function() {
      var input = $(this);
      if (input.text() === '' || 
          input.html() === '<i>' + $(this).data(_Data.PLACEHOLDER) + '</i>') {

        $(this).addClass(_Data.PLACEHOLDER);
        input.html('<i>' + input.data(_Data.PLACEHOLDER) + '</i>');
      }
      // Remove <br> tag added by firefox more or less randomly
      // (see https://bugzilla.mozilla.org/show_bug.cgi?id=930432)
      else {
        input.find('br').remove();
      }
    });

    var termAndDefinition = term.selector.add(definition.selector);
    termAndDefinition.mouseenter(function () {
      $(this).children('.btn-image').css('visibility', 'visible');
    });
    termAndDefinition.mouseleave(function () {
      $(this).children('.btn-image').css('visibility', 'hidden');
    });

    term.mediaInput.add(definition.mediaInput).change(function (e) {
      // TODO: add an attribute to inputs to know if its 
      // definition or term
      console.log(e);
      var canvas = definition.media.children('.media-canvas').get(0);
      var media = e.target.files[0];
      deckEditor.drawMedia(
        canvas, media, _MEDIA.HALFSIZE.MAX_WIDTH, _MEDIA.HALFSIZE.MAX_HEIGHT
      );

      var uploader = new SocketIOUploader(socket);
      uploader.upload(media);
    });
  }
};

/*
 * Socket io event listeners
 */
socket.on(_Event.FLASHCARD_SAVED, function (flashcard) {
  // TODO: Treat case where several flashcards have been saved
  // TODO: Handle locks

  if (typeof flashcard.localId === 'undefined') {
    return;
  }

  var f = flashcardList.children('[data-' + _Data.LOCAL_ID + 
                                 '=' + flashcard.localId + ']');

  // TODO: send a delete event for that id if the flashcard is not found

  f.data(_Data.FLASHCARD_ID, flashcard.id);
  f.removeData(_Data.LOCAL_ID);

  deck._unlock(flashcardList.children('[data-' + _Data.FLASHCARD_ID + '=' + 
                                      flashcard.nextId + ']'));
  var toSend = [];

  var prev = new FlashcardItem(f.prev('.flashcard-item'));
  while (prev.exists() && typeof prev.id === 'undefined') {
    toSend.unshift({
      nextId: flashcard.id,
      term  : {
        media: prev.term.media.html(),
        text: prev.term.text.html()
      },
      definition  : {
        media: prev.definition.media.html(),
        text: prev.definition.text.html()
      }
    });

    prev = new FlashcardItem(prev.selector.prev('.flashcard-item'));
  }
  var next = new FlashcardItem(f.next('.flashcard-item'));
  while (next.exists() && typeof next.id === 'undefined') {
    toSend.unshift({
      prevId: flashcard.id,
      term  : {
        media: next.term.media.html(),
        text: next.term.text.html()
      },
      definition  : {
        media: next.definition.media.html(),
        text: next.definition.text.html()
      }
    });

    next = new FlashcardItem(next.selector.next('.flashcard-item'));
  }

  if (toSend.length > 0) {
    socket.emit(_Event.SAVE_FLASHCARD, {flashcards: toSend});
  }
});

/*
 * Image upload
 */

function showMediaUploadForm () {
  this.find('.upload-form').css('display', 'inline-block');
}

$('.btn-image').click(function (e) {
  showMediaUploadForm.call($(this).parent());
  $(this).parent().children('.media').css('display', 'inline-block');
});

$('.btn-browse').click(function (e) {
  if ($(this).data('target') === 'term') {
    term.mediaInput.click();
  }
  else {
    definition.mediaInput.click();
  }
});


var selectedFile;
function fileChosen(event) {
  selectedFile = event.target.files[0];
}

function updateBar(percent){
  document.getElementById('percent').innerHTML = 
    (Math.round(percent*100)/100) + '%';
  var MBDone = Math.round(((percent/100.0) * selectedFile.size) / 1048576);
  document.getElementById('MB').innerHTML = MBDone;
}

//window.addEventListener('load', ready);

