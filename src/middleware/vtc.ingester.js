'use strict';

const Bluebird = require('bluebird');
const Redis = require('../middleware/database').client;
const Request = Bluebird.promisify(require('request'), {multiArgs: true});

const endPoints = ['getdifficulty', 'getblockcount', 'getnetworkhashps'];

/**
 * Polls the given end points every 60 seconds and writes to the redis hash 'coin:vert'
 */
const startIngest = () =>
{
	let apiUrls = ['https://explorer.vercoin.org/api/getdifficulty',
		'https://explorer.vercoin.org/api/getblockcount',
		'https://explorer.vercoin.org/api/getnetworkhashps'],
		interval = 60000;

	setInterval(() =>
	{
		Bluebird.map(apiUrls, (url) =>
		{
			return Request.getAsync(url).spread((response, body) =>
			{
				return JSON.parse(body);
			});
		}).then((response) =>
		{
			Redis.hmset('coin:vert',
				'difficulty', response[0],
				'blockheight', response[1],
				'hashpersec', response[2],
				'lastupdated', moment().toString(), (err, obj) =>
				{
					if (err)
						throw err;

					console.log(obj);
				});
		}).catch((err) =>
		{
			console.log(err);
		});
	}, interval);
};

/**
 * @type {{startIngest: (function())}}
 */
module.exports = {
	startIngest: startIngest
};