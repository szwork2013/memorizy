function Media (file) {
  this.file = file;
}

Media.prototype.draw = function (canvas, maxWidth, maxHeight) {
  var img = document.createElement('img');
  img.src = window.URL.createObjectURL(media);

  img.onload = function() {
    var width = img.width;
    var height = img.height;
     
    if (width > height) {
      if (maxWidth && width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
    } else {
      if (maxHeight && height > maxHeight) {
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

Media.prototype.resize = function (width, height) {
  var canvas = document.createElement('canvas');
  this.draw(canvas, width, height);
  this.file = this._canvasToFile(canvas);
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

