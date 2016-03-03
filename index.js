const express = require('express');
const app = express();
const search = require("./routes/search");


app.use("/", search);

var server = app.listen(3000, function () {
	console.log("Listening on port %s...", server.address().port);
});