const walk = require('walk');
const fs = require('fs');
const yargs = require("yargs");
const assign = require("assign-deep");
const path = require("path");
const textract = require('textract');

const connection = require("./connection");


var defaults = {
	dirRoot: null,
	forceCreateIndex: false
}

function _getParams() {
	// var argv = minimist( process.argv.slice(2) );
	var argv = 
		yargs
		.usage('Usage: node createIndex url [options]')
		.command("d", "Path to root folder")
		.required("d", "dir is required")
		.alias("d", "dir")
		// .required(1, "dir is required")
		// .option("i", {alias: "index", demand: false, describe: "elasticsearch index name", type: "string"})
		// .option("s", {alias: "server", demand: false, describe: "elasticsearch server url", type: "string"})
		// .default("i", "html")
		// .default("s", "http://localhost:9200")
		.help("?")
		.alias("?", "help")
		.example("node createIndex -d /Users/me/Documents", "This will index the given directory and all its sub-directories.")
		.argv;
	var dirRoot = argv.dir;
	if (dirRoot.charAt(dirRoot.length-1) === "/") {
		dirRoot = dirRoot.substring(0, dirRoot.length-1);
	}
	return {
		dirRoot: dirRoot,
		forceCreateIndex: argv.createindex
	}
}

function getConfig() {
	var params = _getParams();
	var config = assign({}, defaults, params);
	return config;
}


function takeAWalk(dirRoot, options, onDone) {
	if (!dirRoot) {
		console.log("Missing param -dir");
		return;
	}
	var out = [];

	var fileCounterSuccess = 0,
		fileCounterIgnored = 0,
		fileCounterError = 0;

	console.log(`Starting walking with root dir: ${dirRoot}`);
	
	var walker = walk.walk(dirRoot, {});

	walker.on("file", function (root, stats, next) {
		const fullDir = root + "/" + stats.name;
		
		fileCounterSuccess += 1;
		// var ext = path.extname( stats.name );

		// Read the contents of files
		textract.fromFileWithPath(fullDir, function(error, text) {
			if (error) {
				// console.log(error);
				text = "";
			}
			var path = fullDir;
			if (options.excludeRoot) {
				path = fullDir.replace(dirRoot+"/", ""); // remove rootDir
			}
			out.push({
				path: path,
				title: stats.name,
				descr: text
			});
			next();
		});

	});
	walker.on("errors", function (root, nodeStatsArray, next) {
		fileCounterError += 1;
		next();
	});
	walker.on("end", function () {
		console.log(`Files successful: ${fileCounterSuccess}\nFiles error: ${fileCounterError}`);
		onDone(out);
	});


}

function doTheIndexing(dirRoot, excludeRoot) {
	
	takeAWalk(dirRoot, {excludeRoot: excludeRoot}, function(result) {
		// console.log(out);

		result.forEach(function(item, i) {
			connection.client.index({
				index: connection.index,
				type: connection.indexType,
				id: i+1,
				body: {
					title: item.title,
					path: item.path,
					descr: item.descr.substring(0, 100)
				}

			});
		});
		// var bulk = [];
		// result.forEach(function(item, i) {
		// 	// the required metadata
		// 	bulk.push({create: {_index: connection.index, _type: connection.indexType, _id: i+1} });
			
		// 	// the doc
		// 	bulk.push({
				// title: item.title,
				// descr: item.descr
		// 	});
		// });
		// connection.client.bulk( bulk );

	});
}

function createEmptyIndex(onSuccess) {
	return connection.client.indices.delete({index: connection.index}, function() {
		connection.client.indices.create({
			index: connection.index,
			type: connection.indexType,
			body: {
				settings: {
					// [connection.index] : {
						"analysis" : {
							"analyzer" : {
								"autocomplete_term" : {
									"tokenizer": "autocomplete_edge",
									"filter": ["lowercase"]
								},
								"autocomplete_search": {  
									"tokenizer": "keyword",
									"filter": ["lowercase"]
								}
							},
							"tokenizer" : {
								"autocomplete_edge" : {
									"type": "edgeNGram",  // edgeNGram nGram
									"min_gram": 1,
									"max_gram": 100
								}
							}
						}
					// }
				}
				,
				mappings: {
					[connection.index] : {
						"properties": {
							"title": {
								"type": "string",
								"analyzer": "autocomplete_term", // previously using index_analyzer as given in some examples which gives error
								"search_analyzer": "autocomplete_search"
							},
							"descr": {
								"type": "string",
								"analyzer": "autocomplete_term",
								"search_analyzer": "autocomplete_search"
							}
						}
					}
				}
			}
		}, function(error) {
			if (error) {
				console.log(error);
				return;
			}
			console.log("Success!");
			onSuccess();
		});
		
	});
}

function main() {
	var config = getConfig();
	console.log(`Starting indexing with these options:\n${JSON.stringify(config, true, 4)}\n`);

	connection.client.indices.exists({
		index: connection.index
	}, function(error, exists) {
		if (!exists || config.forceCreateIndex === true) {
			// It doesn't exist – create it!
			createEmptyIndex( () => doTheIndexing(config.dirRoot, false) );
		}
		else {
			doTheIndexing(config.dirRoot, false);
		}
	});



}


main();
