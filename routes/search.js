const express = require('express');
const app = express();
const router = express.Router();
const elasticsearch = require("elasticsearch");
const connection = require("./../connection");

const indexName = "rubbish";
const indexType = "rubbish-type";



function searchFor(q, callback) {
	return connection.client.search({
		index: indexName,
		// type: indexType,
		// q: term
		body: {
			query: {
				"bool": {
					"should": [
						{ "match": { "title":  {query: q, boost: 2} }},
						{ "match": { "descr": {query: q} }}
					]
				}
			},
			suggest: {
				suggestions: {
					text: q,
					term: {
						field: "title"
					}
				}
			}
		}

	}, callback);
}

// function suggest(term, callback) {
// 	;
// 	return connection.client.suggest({
// 		index: indexName,
// 		// type: indexType,
// 		length: 1,
// 		body: {
// 			suggestions: {
// 				text: term,
// 				term: {
// 					field: "descr"
// 				}
// 			}
// 		}
// 	}, callback);
// }



router.get('/search', function(req, res) {
	var q = req.query.q;
	if (!q || !q.length) {
		res.json({});
		return;
	}
	searchFor(q, function(error, response) {
		if (error)
			return res.json({ status: "error", msg: JSON.stringify(error) });
		res.json(response);
	});
});

module.exports = router;