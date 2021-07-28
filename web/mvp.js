// 1. new-game
// 2. dealing
// 3. player-turn
// 4. end-game

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
	watch: {
		deck: function (old_value, new_value) {
			var player_total = this.get_total(this.hands.player);
			var dealer_total = this.get_total(this.hands.dealer);

			if (player_total > 21) {
				this.message = "Player BUST!";
				this.state = "end-game";
			}

			if (dealer_total > 21) {
				this.message = "Dealer BUST!";
				this.state = "end-game";
			}

			if (player_total == 21) {
				this.message = "Player has Blackjack!";
			}

			if (dealer_total == 21) {
				this.hands.delear.map((card) => {
					card.flipped = true;
				});
				this.message = "Dealer has Blackjack!";
			}
		},
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

			// Return to Deck
			this.deck = this.deck.concat(this.hands.dealer);
			this.deck = this.deck.concat(this.hands.player);

			// Dealer
			this.hands.dealer = [];
			this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, true));
			this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, false));

			// Player
			this.hands.player = [];
			this.hands.player = this.hands.player.concat(this.pull_cards(2, true));

			this.state = "player-turn";
			this.message = "Your Move";
		},
		pull_cards: function (count, flipped) {
			const drawn_cards = _.take(this.deck, count);
			drawn_cards.map((card) => {
				card.flipped = flipped;
			});
			this.deck = _.drop(this.deck, count);
			return drawn_cards;
		},
		action_hit: function () {
			this.hands.player = this.hands.player.concat(this.pull_cards(1, true));
		},
		action_stand: function () {
			this.dealer_move();
		},
		dealer_move: function () {
			if (this.state !== "end-game") {
				this.hands.dealer.map((card) => {
					card.flipped = true;
				});
				while (this.get_total(this.hands.dealer) < 17) {
					this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, true));
				}
				this.find_winner();
			}
		},
		find_winner: function () {
			var player_total = this.get_total(this.hands.player);
			var dealer_total = this.get_total(this.hands.dealer);

			if (player_total == dealer_total) {
				this.message = "DRAW";
				return;
			}

			if (player_total > dealer_total) {
				this.message = "Player WINS";
				return;
			}

			if (dealer_total > player_total) {
				this.message = "Dealer WINS";
				return;
			}
		},
		get_total(cards) {
			var total_value = 0;
			var have_ace = false;

			cards.forEach((card) => {
				if (card.value == "J" || card.value == "Q" || card.value == "K") {
					total_value += 10;
				} else {
					if (card.value == "A") {
						have_ace = true;
					} else {
						total_value += Number(card.value);
					}
				}
			});

			if (have_ace) {
				if (total_value > 10) {
					total_value += 1;
				} else {
					total_value += 11;
				}
			}

			return total_value;
		},
	},
});
