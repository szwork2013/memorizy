/**
 * SocketIOUploader
 *
 * @constructor
 * @param {Object} socket the object obtained
 *    with socket-io's connect method
 */
function SocketIOUploader (socket) {
  this.socket = socket;
  this.listeners = {};

  this.chunkSize = 524288; // 512 ko
}

/** @enum {string} */
SocketIOUploader.prototype.Events = {
  START: 'start',
  DATA: 'data',
  DONE: 'done',
  ERROR: 'error'
};

/** @enum {string} */
SocketIOUploader.prototype.Errors = {
  ILLEGAL_ARGUMENT: 'illegalArgument',
  UNSUPPORTED_BROWSER: 'unsupportedBrowser',
  FILE_TOO_BIG: 'fileTooBig',
  ILLEGAL_FILE_TYPE: 'illegalFileType',
  UNKNOWN: 'unknown'
};

SocketIOUploader.prototype.upload = function (file) {
  this._startUpload(file);

  var that = this;
  this.socket.on(this.Events.DATA, function (data) {
    that.emit(that.Events.DATA, data);
    that._readChunk(file, data.downloaded);
  });

  this.socket.on(this.Events.DONE, function (media) {
    this.emit(this.Events.DONE, media);
  });
};

SocketIOUploader.prototype._startUpload = function (file) {
  if (!window.File || !window.FileReader) {
    this.emit(this.Events.ERROR, {
      type: this.Errors.UNSUPPORTED_BROWSER, 
      msg: 'Your browser does not support the File API'
    });
    return;
  }

  var that = this;
  this.reader = new FileReader();

  this.reader.onload = function (e) {
    that.socket.emit(that.Events.DATA, {
      name: file.name,
      data: e.target.result
    });
  };

  this.socket.emit(this.Events.START, {
    name: file.name, 
    size: file.size
  });
};

SocketIOUploader.prototype._readChunk = function (file, place) {
  var chunk = file.slice(
    place, place + Math.min(this.chunkSize, (file.size - place))
  );

  this.reader.readAsBinaryString(chunk);
};

SocketIOUploader.prototype.on = function (eventName, callback) {
  if (typeof eventName !== 'string') {
    throw 'The event name must be a string';
  }
  if (!(callback instanceof Function)) {
    throw 'The callback must be a function';
  }

  if (typeof this.listeners[eventName] === 'undefined' ||
     this.listeners[eventName] === null) {
    this.listeners[eventName] = [];
  }

  this.listeners[eventName].push(callback);
};

/*
 *SocketIOUploader.prototype.off = function (eventName, callbacks) {
 *  if (typeof eventName !== 'string') {
 *    console.log('The event name must be a string');
 *    return;
 *  }
 *  if (typeof callbacks === 'undefined') {
 *    this.listeners[eventName] = null;
 *    return;
 *  }
 *  if (!(this.listeners[eventName])) {
 *    return;
 *  }
 *
 *  this.listeners[eventName].filter(function (element) {
 *    if (callbacks.indexOf(element) !== -1) {
 *      return false;
 *    }
 *    return true;
 *  });
 *};
 */

SocketIOUploader.prototype.emit = function (name, event) {
  if (!(this.listeners[name])) {
    return;
  }

  this.listeners[name].forEach(function (callback, index, arr) {
    callback(event);
  });
};
