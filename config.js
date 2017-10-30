'use strict';

const fs = require('fs');

const init = function (process)
{
	let config = {};

	if (process.argv[2] && process.argv[2] === 'live')
	{
		config = require('./config/config.live.json');
		config.server.tls = {
			key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.com.key'),
			cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_com.crt')
		}
	}
	else
	{
		config = require('./config/config.dev.json');
	}

	return config;
};

module.exports = {
	init: init
};