'use strict';

const fs = require('fs');
const tls = require('tls');

const init = function (process)
{
	let config = require('./config/config.' + (process.env.NODE_ENV || 'dev') + '.json');

	if (process.env.NODE_ENV)
	{
		let secureContext = {
			'www.vertcoin-dashboard.com': tls.createSecureContext({
				key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.com.key', 'utf8'),
				cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_com.crt', 'utf8')
			}),
			'www.vertcoin-dashboard.co.uk': tls.createSecureContext({
				key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.co.uk.key', 'utf8'),
				cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_co_uk.crt', 'utf8')
			})
		};

		config.server.tls = {
			SNICallback: function (domain, callback) {
				console.log(domain);
				if (secureContext[domain])
				{
					if (callback)
						callback(null, secureContext[domain]);
					else
						return secureContext[domain];
				} else {
					throw new Error('No keys/certificates for domain requested');
				}
			},
			key: fs.readFileSync('/etc/ssl/vertcoin-dashboard.co.uk.key', 'utf-8'),
			cert: fs.readFileSync('/etc/ssl/vertcoin-dashboard_co_uk.crt', 'utf-8'),
		};
	}
	return config;
};

module.exports = {
	init: init
};