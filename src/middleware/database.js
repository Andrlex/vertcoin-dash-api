'use strict';

const Redis = require('redis');
const client = Redis.createclient({
	host: '127.0.0.1',
	port: 6379
});

module.exports = {
	client: client
};