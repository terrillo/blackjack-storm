const express = require("express");
const compressor = require("node-minify");
const watcher = require("node-watch");

const app = express();
const port = 3000;

app.use("/", express.static("web"));

app.listen(port, () => {
	console.log(`Blackjack Storm Ready PORT -> ${port}`);

	// JS Compressor
	watcher("web/src/js", { recursive: true }, function () {
		compressor.minify({
			compressor: "gcc",
			input: "./web/src/js/**/*.js",
			output: "./web/dist/js/blackjack.js",
			callback: function () {
				console.log("-> JS Compressed");
			},
		});
	});
});
