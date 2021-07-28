const express = require("express");

const app = express();
const port = 3000;

app.use("/", express.static("web"));

app.listen(port, () => {
	console.log(`Blackjack Storm Ready PORT -> ${port}`);
});
