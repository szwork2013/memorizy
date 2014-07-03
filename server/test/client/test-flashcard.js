describe('Flashcard', function () {
  describe('#term and #definition', function () {
    it('should alter item values', function () {
      var f = new Flashcard();
      var fi = new FlashcardItem();

      f.item = fi;

      f.term = {
        text: 'hello',
        media: 'world'
      };
      f.definition = {
        text: 'how are',
        media: 'you ?'
      };

      fi.term.text.should.equal(f.term.text);
      fi.term.media.should.equal(f.term.media);
      fi.definition.text.should.equal(f.definition.text);
      fi.definition.media.should.equal(f.definition.media);
    });
  });

  describe('#item', function () {
    it('should update flashcard values', function () {
      var f = new Flashcard();
      var fi = new FlashcardItem();

      fi.term = {
        text: 'hello',
        media: 'world'
      };
      fi.definition = {
        text: 'how are',
        media: 'you ?'
      };

      f.item = fi;

      f.term.text.should.equal(f.term.text);
      f.term.media.should.equal(f.term.media);
      f.definition.text.should.equal(f.definition.text);
      f.definition.media.should.equal(f.definition.media);
    });
  });
});
