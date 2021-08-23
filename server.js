const express = require("express");
const compressor = require("node-minify");
const watcher = require("node-watch");
const eta = require("eta");
const path = require("path");

const app = express();
const port = 3000;

app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set("views", "./web/views");
eta.configure({
	views: path.join(__dirname, "./web/views"),
});

app.use("/dist/", express.static("web/dist"));

app.get("/", function (req, res) {
	res.render("marketing");
});

app.get("/play-now", function (req, res) {
	res.render("play-now");
});

app.listen(port, () => {
	console.log(`Blackjack Storm Ready PORT -> ${port}`);

	// JS Compressor
	watcher("web/src/js", { recursive: true }, function () {
		compressor
			.minify({
				compressor: "gcc",
				input: "./web/src/js/**/*.js",
				output: "./web/dist/js/blackjack.js",
				callback: function () {
					console.log("-> JS Compressed");
				},
			})
			.catch((e) => {
				console.error(e);
			});
	});
});
