/* jshint expr: true */
describe('FlashcardItem', function () {
  var sandbox = sinon.sandbox.create();

  afterEach(function () {
    sandbox.restore();
  });

  describe('term and definition', function () {
    it('should update its properties if there is any change', function () {
      var fi = new FlashcardItem();
      
      fi.term = {
        text: 'hello',
        media: 'test'
      };

      fi.term.text.should.equal('hello');
      fi.term.media.should.equal('test');
    });

    it('should update the DOM if there is any change and the selector is defined', function () {
      var fi = new FlashcardItem();

      var oldHtml = fi.selector.html();
      fi.term = {text:'hello world'};
      fi.selector.html().should.not.equal(oldHtml);
    });
  });

  describe('selector', function () {
    it('should not allow to set a selector manually', function () {
      var fi = new FlashcardItem();

      (function () {
        fi.selector = 'test';
      }).should.throw();
    });

    it('should always return the same selector', function () {
      var fi = new FlashcardItem();

      var s = fi.selector;
      fi.term = {text: 'abc'};

      s.should.equal(fi.selector);
    });
  });
});
