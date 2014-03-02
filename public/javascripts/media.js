function Media () {}

/** @private */
var _MEDIA = {
  PATH: '/media/',
  THUMBNAIL: {
    MAX_HEIGHT: '1em',
    MAX_WIDTH : '1em'
  },
  HALFSIZE: {
    MAX_HEIGHT: term.selector.height(),
    MAX_WIDTH : term.selector.width() / 2
  },
  FULLSIZE: {
    MAX_HEIGHT: term.selector.height(),
    MAX_WIDTH : term.selector.width()
  }
};

/**
 * draw
 *
 * @param {Element} canvas The DOM canvas element where the
 *    media must be drawn
 * @param {File} media The file to draw in the canvas
 * @param {number} maxWidth
 * @param {number} maxHeight
 */
Media.prototype.draw = function (
  canvas, media, maxWidth, maxHeight) {

  if (!media.type.match(/image.*/)) {
    alert('The selected file is not an image');
  }

  var img = document.createElement('img');
  img.src = window.URL.createObjectURL(media);

  img.onload = function() {
    var width = img.width;
    var height = img.height;
     
    if (width > height) {
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
  };
};

Media.prototype._canvasToFile = function (canvas) {
  var url = canvas.toDataURL();
  var blob = this._dataURItoBlob(url);

  var form = $('form');
  var fd = new FormData(form.get(0));
  fd.append('canvasImage', blob);
  console.log('form html = ', form.html());
};

Media.prototype._dataURItoBlob = function (dataURI) {
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
};

