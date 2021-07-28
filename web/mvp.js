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
	},
});
