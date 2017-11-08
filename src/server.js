#!/usr/bin/env nodejs
'use strict';

const Hapi = require('hapi');
const Server = new Hapi.Server();
const Intert = require('inert');
const Path = require('path');
const Url = require('url');

const routes = require('./src/api/index.js');
const ingest = require('./src/middleware/vtc.ingester');
const config = require('./config.js').init(process);

Server.connection(config.server);

// if we've created a secure connection, listen on port 80 as well
if (config.server.tls)
{
	Server.connection({port: 80});

	Server.ext('onRequest', (request, reply) => {

		if (request.connection.info.port !== 443) {

			return reply.redirect(Url.format({
				protocol: 'https',
				hostname: request.info.hostname,
				pathname: request.url.path,
				port: 443
			}));
		}

		return reply.continue();
	});
}

Server.start((err) =>
{
	if (err)
		throw err;

	console.log('Server running..');

	ingest.startIngest();

	console.log('Ingest started..');
});

Server.route(routes);

Server.register([
	Intert
], (err) => {
	if (err)
		throw err;

	Server.route({
		method: 'GET',
		path: '/{path*}',
		handler: {
			directory: {
				path: Path.resolve('/var/www/vertcoin-dashboard.com/public'),
				listing: false,
				index: true
			}
		}
	})

});