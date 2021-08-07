Vue.component("c-card", {
	template: "#template-card",
	props: ["details"],
	data: function () {
		var extras = "playing-card--" + this.details.suit + " ";
		var val = this.details.value;
		if (!this.details.flipped) {
			extras += "playing-card--back";
		}
		return {
			extras,
			val,
		};
	},
});
