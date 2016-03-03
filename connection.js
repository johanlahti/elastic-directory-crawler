const elasticsearch = require("elasticsearch");

var obj = {
	index: "rubbish",
	indexType: "rubbish-type"
};

function openConnection() {
	obj._client = obj._client || new elasticsearch.Client({
		host: "localhost:9200"
		// log: "trace"
	});
	return obj._client;
}
obj.client = obj.client || openConnection();


exports.client = obj.client;
exports.index = obj.index;
exports.indexType = obj.indexType;