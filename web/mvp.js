// 1. new-game
// 2. dealing

var app = new Vue({
	el: "#app",
	data: {
		message: "Hey You!",
		state: "new-game",
		deck: [],
		hands: {
			dealer: [],
			player: [],
		},
	},
	created: function () {
		this.buld_deck();
	},
	methods: {
		buld_deck: function () {
			// Build Deck
			var base_cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
			var base_suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
			base_cards.forEach((value) => {
				base_suits.forEach((suit) => {
					this.deck.push({
						value,
						suit,
						flipped: true,
					});
				});
			});
			this.deck = _.shuffle(this.deck);
		},
		deal_cards: function () {
			this.state = "dealing";
			this.message = "Dealing cards";

			// Dealer
			this.hands.dealer = [];
			this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, true));
			this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, false));

			// Player
			this.hands.player = [];
			this.hands.player = this.hands.player.concat(this.pull_cards(2, true));
		},
		pull_cards: function (count, flipped) {
			const drawn_cards = _.take(this.deck, count);
			drawn_cards.map((card) => {
				card.flipped = flipped;
			});
			this.deck = _.drop(this.deck, count);
			return drawn_cards;
		},
	},
});
