#!/usr/bin/env nodejs
'use strict';

const Hapi = require('hapi');
const Server = new Hapi.Server();
const Intert = require('inert');
const Path = require('path');

const routes = require('./src/api/index.js');
const ingest = require('./src/middleware/vtc.ingester');

let tls = {
	key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.com.key'),
	cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_com.crt')
};

Server.connection({
	host: '54.37.64.232',
	port: 443,
	tls: tls
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

Server.register([
	Intert
], (err) => {
	if (err)
		throw err;

	Server.route({
		method: '/GET',
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