// 1. new-game
// 2. dealing
// 3. player-turn
// 4. end-game

var default_interval = 500;
var app = new Vue({
	el: "#play-now",
	data: {
		delay_interval: 500,
		message: "Welcome!",
		state: "new-game",
		deck: [],
		hands: {
			dealer: [],
			player: [],
		},
		template: {
			card: {
				value: 0,
				suit: 0,
				flipped: false,
			},
		},
	},
	created: function () {
		this.buld_deck();
	},
	watch: {
		state: function () {
			this.delay_interval = default_interval;
		},
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
				this.message = "Player has 21!";
			}

			if (dealer_total == 21) {
				this.hands.dealer.map((card) => {
					card.flipped = true;
				});
				this.message = "Dealer has 21!";
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
			this.delay(() => {
				this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, true));
			});
			this.delay(() => (this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, false))));

			// Player
			this.hands.player = [];
			this.delay(() => (this.hands.player = this.hands.player.concat(this.pull_cards(1, true))));
			this.delay(() => {
				this.hands.player = this.hands.player.concat(this.pull_cards(1, true));
				this.state = "player-turn";
				this.message = "Your Move";
			});
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
			this.delay_interval = default_interval;
			if (this.state !== "end-game") {
				this.hands.dealer.map((card) => {
					card.flipped = true;
				});

				var total = this.get_total(this.hands.dealer);
				for (var i = 0; i < 10; i++) {
					setTimeout(() => {
						total = this.get_total(this.hands.dealer);
						if (total < 17 && total < 21) {
							this.hands.dealer = this.hands.dealer.concat(this.pull_cards(1, true));
							i++;
						}
					}, 200);
				}
				this.find_winner();
			}
		},
		find_winner: function () {
			this.state = "end-game";
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
		get_total(cards, not_flipped = true) {
			var total_value = 0;
			var number_of_aces = 0;

			cards.forEach((card) => {
				if (!card.flipped && !not_flipped) {
					return;
				}

				if (card.value == "J" || card.value == "Q" || card.value == "K") {
					total_value += 10;
				} else {
					if (card.value == "A") {
						number_of_aces += 1;
					} else {
						total_value += Number(card.value);
					}
				}
			});

			// For each Ace
			for (var i = 0; i < number_of_aces; i++) {
				if (total_value > 10) {
					total_value += 1;
				} else {
					total_value += 11;
				}

				// More than one Ace
				if (total_value > 21) {
					total_value -= 10;
				}
			}

			return total_value;
		},
		build_template(type, details) {
			if (type == "card") {
				var extras = "";
				var val = details.value;
				if (details.flipped) {
					extras = "black";
					val = details.value;
				} else {
					extras = "playing-card--back";
					val = "";
				}
				return `<div class="slide-left ph2 pt2 bg-white mr2 ${extras} playing-card">
									<div>${val}</div>
								</div>`;
			}
		},
		delay(fn) {
			this.delay_interval += 300;
			setTimeout(fn, this.delay_interval);
		},
	},
});
