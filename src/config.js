'use strict';

const fs = require('fs');

const init = function (process)
{
	let config = require('./config/config.' + (process.env.NODE_ENV || 'dev') + '.json');
	let secureContext = {
		'vertcoin-dashboard.com': tls.createSecureContext({
			key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.com.key', 'utf8'),
			cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_com.crt', 'utf8')
		}),
		'vertcoin-dashboard.co.uk': tls.createSecureContext({
			key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.co.uk.key', 'utf8'),
			cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_co_uk.crt', 'utf8')
		}),
	};

	if (process.env.NODE_ENV)
	{
		config.server.tls = {
			SNICallback: function (domain, cb) {
				if (secureContext[domain]) {
					if (cb) {
						cb(null, secureContext[domain]);
					} else {
						return secureContext[domain];
					}
				} else {
					throw new Error('No keys/certificates for domain requested');
				}
			},
			// must list a default key and cert because required by tls.createServer()
			key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.com.key'),
			cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_com.crt'),
		};
	}
	return config;
};

module.exports = {
	init: init
};