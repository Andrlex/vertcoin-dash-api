'use strict';

const Hapi = require('hapi');
const Server = new Hapi.Server();

const routes = require('./src/api/index.js');
const ingest = require('./src/middleware/vtc.ingester');

Server.connection({
	host: '127.0.0.1',
	port: 3001
});

Server.start((err) =>
{
	if (err)
		throw err;

	console.log('Server running..');

	ingest.startIngest();

	console.log('Ingest started..');
});

Server.route(routes);