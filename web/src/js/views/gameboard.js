// 1. new-game
// 2. dealing
// 3. player-turn
// 5. end-game

if (document.getElementById("view--gameboard") !== null) {
	var default_interval = 500;
	var viewGameboard = new Vue({
		el: "#view--gameboard",
		data: {
			delay_interval: default_interval,
			message: "Welcome!",
			state: "new-game",
			deck: [],
			table: {
				rewarded: false,
				bet: 1,
				payout: 0,
			},
			player: {
				chips: 0,
				demerits: 0,
				info: false,
				new: false,
				current_rank: false,
			},
			hands: {
				dealer: [],
				player: [],
			},
			totals: {
				player: 0,
				dealer: 0,
			},
			template: {
				card: {
					value: 0,
					suit: 0,
					flipped: false,
				},
			},
			leaderboard: [],
		},
		created: function () {
			this.buld_deck();

			firebase.auth().onAuthStateChanged((user) => {
				this.player.info = user;

				if (user) {
					this.message = "Welcome " + user.displayName + "!";
					FIRESTORE.collection("leaderboard")
						.doc(user.uid)
						.get()
						.then((doc) => {
							if (doc.exists) {
								var user_info = doc.data();
								this.player.chips = user_info.chips;
								this.player.demerits = user_info.demerits;
							} else {
								FIRESTORE.collection("leaderboard").doc(user.uid).set({
									chips: 100,
									demerits: 0,
									displayName: user.displayName,
								});
								this.player.new = true;
							}
							this.clean_up();
						});
				}
			});

			this.update_leaderboard();
			setInterval(() => {
				this.update_leaderboard();
			}, 30000);
		},
		watch: {
			"player.chips": function () {
				if (this.player.info) {
					FIRESTORE.collection("leaderboard").doc(this.player.info.uid).update({
						chips: this.player.chips,
					});
				}
			},
			"player.demerits": function () {
				FIRESTORE.collection("leaderboard").doc(this.player.info.uid).update({
					demerits: this.player.demerits,
				});
			},
			"player.current_rank": function () {
				console.log("NOW RANKED " + this.player.current_rank);
			},
			state: function () {
				this.delay_interval = default_interval;
			},
			deck: function (old_value, new_value) {
				this.totals.player = this.get_total(this.hands.player);
				this.totals.dealer = this.get_total(this.hands.dealer);

				if (this.totals.player > 21) {
					this.message = "Player BUST!";
					this.state = "end-game";
					this.end_turn();
				}

				if (this.totals.dealer > 21) {
					this.message = "Dealer BUST!";
					this.transaction("+", 2);
					this.end_turn();
				}

				if (this.totals.player == 21) {
					this.message = "Blackjack!!";
					this.transaction("+", 4);
					this.end_turn();
				}
			},
		},
		methods: {
			end_turn: function () {
				this.state = "end-game";
				this.clean_up();
			},
			buld_deck: function () {
				// Build Deck
				var base_cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
				var base_suits = ["Clubs", "Diamonds", "Hearts", "Spades"];

				// 6 decks
				for (var i = 0; i < 6; i++) {
					base_cards.forEach((value) => {
						base_suits.forEach((suit) => {
							this.deck.push({
								value,
								suit,
								flipped: true,
							});
						});
					});
				}

				this.deck = _.shuffle(this.deck);
			},
			deal_cards: function () {
				this.hands.dealer = [];
				this.hands.player = [];

				setTimeout(() => {
					this.state = "dealing";
					this.message = "Dealing cards";

					// Dealer
					this.pull_cards("dealer", true);
					this.pull_cards("dealer", false);

					// Player
					this.pull_cards("player", true);
					this.pull_cards("player", true);

					this.state = "player-turn";
					this.message = "Your Move";

					// Take Bet
					this.transaction("-");
				}, 200);
			},
			pull_cards: function (player, flipped) {
				const drawn_cards = _.take(this.deck, 1);
				drawn_cards.map((card) => {
					card.flipped = flipped;
				});
				if (player == "dealer") {
					this.hands.dealer = this.hands.dealer.concat(drawn_cards);
				} else {
					this.hands.player = this.hands.player.concat(drawn_cards);
				}
				this.deck = _.drop(this.deck, 1);
			},
			action_hit: function () {
				// TODO: Disable double down
				this.pull_cards("player", true);
			},
			action_stand: function () {
				this.dealer_move();
			},
			action_payback: function () {
				if (this.player.chips > 200 && this.player.demerits > 0) {
					this.player.demerits -= 1;
					this.player.chips -= 200;
				}
			},
			action_doubledown: function () {
				this.transaction("-");
				this.table.bet *= 2;
				this.action_hit();
				setTimeout(() => {
					this.dealer_move();
				}, this.delay_interval);
			},
			dealer_move: function () {
				this.delay_interval = default_interval;
				this.hands.dealer.map((card) => {
					card.flipped = true;
				});
				this.totals.dealer = this.get_total(this.hands.dealer);

				var total;
				for (var i = 0; i < 10; i++) {
					if (this.state !== "end-game") {
						console.log(this.state);
						total = this.get_total(this.hands.dealer);
						console.log(total);
						if (total <= 17 && total < 21) {
							console.log("PULL");
							this.pull_cards("dealer", true);
							this.totals.dealer = this.get_total(this.hands.dealer);
							i++;
						}
					}
					this.find_winner();
					this.clean_up();
				}
			},
			clean_up: function () {
				// Player Need Chips
				if (this.player.chips == 0) {
					this.player.chips = 100;
					if (!this.player.new) {
						this.player.demerits += 1;
						this.player.new = false;
					}
				}

				if (this.table.bet > this.player.chips) {
					this.table.bet = 1;
				}

				if (this.table.bet <= 0) {
					this.table.bet = 1;
				}

				// Player Rewarded
				this.table.rewarded = false;
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
			get_total: function (cards) {
				var total_value = 0;
				var number_of_aces = 0;

				cards.forEach((card) => {
					if (!card.flipped) {
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
			delay: function (fn) {
				this.delay_interval += 300;
				setTimeout(fn, this.delay_interval);
			},
			transaction: function (type, multiply) {
				var payout;
				if (!this.table.rewarded) {
					if (type == "-") {
						payout = -this.table.bet;
						this.player.chips -= this.table.bet;
					} else {
						this.table.rewarded = true;
						payout = this.table.bet * multiply;
						this.player.chips += payout;
					}
				}

				if (payout > 0) {
					this.table.payout = "+" + payout;
				} else {
					this.table.payout = payout;
				}

				console.log("payout", payout);
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
			update_leaderboard: function () {
				FIRESTORE.collection("leaderboard")
					.orderBy("chips", "desc")
					.get()
					.then((documentSnapshots) => {
						this.leaderboard = [];
						var rank = 1;
						documentSnapshots.docs.forEach((doc) => {
							var data = doc.data();
							if (data.displayName == this.player.info.displayName) {
								this.player.current_rank = rank;
							}
							data["rank"] = rank;
							this.leaderboard.push(data);
							rank++;
						});
						// console.log(documentSnapshots);
					});
			},
		},
	});
}
