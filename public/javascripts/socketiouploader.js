/**
 * SocketIOUploader
 *
 * @constructor
 * @param {Object} socket the object obtained
 *    with socket-io's connect method
 */
function SocketIOUploader (socket) {
  this.socket = socket;

  this.events = {
    start: 'start',
    data: 'data',
    done: 'done',
    error: 'error'
  };
}

/** @enum {string} */
SocketIOUploader.prototype.Errors = {
  ILLEGAL_ARGUMENT: 'illegalArgument',
  UNSUPPORTED_BROWSER: 'unsupportedBrowser',
  FILE_TOO_BIG: 'fileTooBig',
  ILLEGAL_FILE_TYPE: 'illegalFileType',
  UNKNOWN: 'unknown'
};

SocketIOUploader.prototype.chunkSize = 524288; // 512 ko

SocketIOUploader.prototype.upload = function (file) {
  this._startUpload(file);

  this.socket.on(this.events.data, function (data) {
    this._emit(this.events.data, data);
    this._readChunk(file, data.downloaded);
  });

  this.socket.on(this.events.done, function (media) {
    this._emit(this.events.done, media);
  });
};

SocketIOUploader.prototype._startUpload = function (file) {
  if (!window.File || !window.FileReader) {
    this._emit(this.events.error, {
      type: this.Errors.UNSUPPORTED_BROWSER, 
      msg: 'Your browser does not support the File API'
    });
    return;
  }

  if (!(file instanceof window.File)) {
    this._emit(this.events.error, {
      type: this.Errors.ILLEGAL_ARGUMENT,
      msg: 'The file argument must be a window.File object'
    });
    return;
  }

  this.reader = new FileReader();

  this.reader.onload = function (e) {
    this.socket.emit(this.events.data, {
      name: file.name,
      data: e.target.result
    });
  };

  this.socket.emit(this.events.start, {
    name: file.name, 
    size: file.size
  });
};

SocketIOUploader.prototype._readChunk = function (file, place) {
  if (!(file instanceof window.File)) {
    this._emit(this.events.error, {
      type: this.Errors.ILLEGAL_ARGUMENT,
      msg: 'The file argument must be a window.File object'
    });
    return;
  }

  var chunk = file.slice(
    place, place + Math.min(this.chunkSize, (file.size - place))
  );

  this.reader.readAsBinaryString(chunk);
};

SocketIOUploader.prototype._emit = function (name, detail) {
  if (!window.CustomEvent) {
    // Polyfill for IE
    (function () {
      function CustomEvent (event, params) {
        detail = detail || {
          bubbles: false, 
          cancelable: false, 
          detail: undefined
        };
        var evt = document.createEvent(name);
        evt.initCustomEvent(
          event, detail.bubbles, detail.cancelable, detail.detail
        );
        return evt;
      }

      CustomEvent.prototype = window.CustomEvent.prototype;

      window.CustomEvent = CustomEvent;
    })();
  }

  var event = new CustomEvent(name, {
    detail: detail,
    bubbles: false,
    cancelable: true
  });

  this.dispatchEvent(event);
};

