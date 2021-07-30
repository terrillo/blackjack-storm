// 1. new-game
// 2. dealing
// 3. player-turn
// 5. end-game

var default_interval = 500;
var app = new Vue({
	el: "#play-now",
	data: {
		delay_interval: 500,
		message: "Welcome!",
		state: "new-game",
		deck: [],
		table: {
			rewarded: false,
			bet: 1,
		},
		player: {
			chips: Number(localStorage.getItem("chips") == null ? 200 : localStorage.getItem("chips")),
			demerits: Number(localStorage.getItem("demerits") == null ? 0 : localStorage.getItem("demerits")),
		},
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
		localStorage.setItem("chips", this.player.chips);
	},
	watch: {
		"player.chips": function () {
			localStorage.setItem("chips", this.player.chips);
		},
		"player.demerits": function () {
			localStorage.setItem("demerits", this.player.demerits);
		},
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
				this.transaction("+", 2);
			}

			if (player_total == 21) {
				this.message = "Player has 21!";
				this.transaction("+", 4);
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

			// Take Bet
			this.transaction("-");
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
				this.clean_up();
			}
		},
		clean_up: function () {
			// Player Need Chips
			if (this.player.chips == 0) {
				this.player.chips = 100;
				this.player.demerits += 1;
			}

			if (this.table.bet > this.player.chips) {
				this.table.bet = 1;
			}

			if (this.table.bet <= 0) {
				this.table.bet = 1;
			}

			// Player Rewarded
			this.table.rewarded = false;

			// Return cards to Deck
			this.deck = this.deck.concat(this.hands.dealer);
			this.deck = this.deck.concat(this.hands.player);
		},
		find_winner: function () {
			this.state = "end-game";
			var player_total = this.get_total(this.hands.player);
			var dealer_total = this.get_total(this.hands.dealer);

			if (player_total == dealer_total) {
				this.message = "DRAW";
				this.transaction("+", 1);
				return;
			}

			if (player_total > dealer_total) {
				this.message = "Player WINS";
				this.transaction("+", 2);
				return;
			}

			if (dealer_total > player_total) {
				this.message = "Dealer WINS";
				return;
			}
		},
		get_total: function (cards, not_flipped = true) {
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
		build_template: function (type, details) {
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
		delay: function (fn) {
			this.delay_interval += 300;
			setTimeout(fn, this.delay_interval);
		},
		transaction: function (type, multiply) {
			if (!this.table.rewarded) {
				if (type == "-") {
					this.player.chips -= this.table.bet;
				} else {
					this.table.rewarded = true;
					var payout = this.table.bet * multiply;
					console.log(payout);
					this.player.chips += payout;
				}
			}
		},
		bet_up: function (val) {
			var new_value = this.table.bet + val;
			if (new_value <= this.player.chips) {
				this.table.bet += val;
			}
		},
		bet_down: function (val) {
			if (this.table.bet > 1) {
				this.table.bet -= val;
			}
		},
	},
});
