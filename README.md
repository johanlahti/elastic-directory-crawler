# elastic-directory-crawler
For the moment being a learning project to evaluate Elasticsearch and Node.
Note: There are opensource software already doing this and much more (e.g. web crawling), such as [Fess](https://github.com/codelibs/fess/).

### What does it do?

Creates an elastic `index` and populates it with data and makes it searchable with autocomplete (suggestions) included.

### Used techniques

- [NodeJS](https://nodejs.org/en/) (routing with [Express](http://expressjs.com/))
- [Elasticsearch](https://www.elastic.co/)

### How?
1. A script scans a given directory and all its sub-directories for files
2. Each file is read and the filename and the file contents forms a `document` which populates the local running elasticsearch instance
3. A Node webservice (using Express) exposes a search API with autocomplete (suggestions).

### How to use it?
```
# 1. Create the index and populate it (the index creation also defines settings and mappings for the index to enable useful searching and autocomplete)
# Specify the (root)directory to be crawled
node createIndex.js --dir /Users/Me --createindex

# 2. Start the webservice and point the browser to http://localhost:3000/search?q=my-query
node index.js
```
