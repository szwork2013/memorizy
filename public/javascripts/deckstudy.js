function DeckStudy (id) {
  this.id = id;
}

DeckStudy.prototype = new Deck(this.id);
