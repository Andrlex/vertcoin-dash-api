'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const Redis = require('../middleware/database').client;
const Request = Bluebird.promisifyAll(require('request'), {multiArgs: true});

const moment = require('moment');

let intervals = {
	minute: 60000,
	hour: 3600000,
	day: 86400000,
	week: 604800000
};

/**
 */
const startIngest = () =>
{
	aggregateData();
	timeTillBlockHalving();
	updateAggregateAtInterval(intervals.hour, 'hour');
	updateAggregateAtInterval(intervals.day, 'day');
	updateAggregateAtInterval(intervals.week, 'week');
};

const timeTillBlockHalving = () =>
{
	setInterval(() =>
	{

		Redis.hmget([
			'coin:vert:week',
			'blockheight',
			'lastupdated'], (err, obj) =>
		{
			let weekHeight = obj[0],
				lastUpdated = moment.unix(obj[1]),
				minutesAgo = moment().diff(lastUpdated, 'minutes'),
				daysAgoUpdated = (minutesAgo / 60) / 24;

			Redis.hmget([
				'coin:vert',
				'blockheight'], (err, obj) =>
			{
				let currentHeight = obj[0];

				let blocksClimbedAverage = (currentHeight - weekHeight) / daysAgoUpdated,
					blocksToGo = ((currentHeight > 840000 ? 1680000 : 840000) - currentHeight),
					estimatedDaysUntilNext = blocksToGo / blocksClimbedAverage;

				Redis.hmset('coin:vert',
					'nextblockhalve', (estimatedDaysUntilNext * 24),(err, obj) => {

						if (err)
							throw err;

					});
			});
		});

	}, 10000);
};

const aggregateData = () =>
{
	let apiUrls = ['https://explorer.vertcoin.org/api/getdifficulty',
			'https://explorer.vertcoin.org/api/getblockcount',
			'https://explorer.vertcoin.org/api/getnetworkhashps'];

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
			let setData = true;

			// Set flag based on if the data has changed
			Redis.hmget([
				'coin:vert',
				'difficulty',
				'blockheight',
				'hashpersec'], (err, obj) =>
			{

				setData = (!(obj[0] == response[0]) || !(obj[1] == response[1]) || !(obj[2] == response[2]));

				if (setData)
				{
					Redis.hmset('coin:vert',
						'difficulty', response[0],
						'blockheight', response[1],
						'hashpersec', response[2],
						'lastupdated', moment().unix().toString(), (err, obj) => {
							if (err)
								throw err;

							console.log(obj);
						});

				}
				else
				{
					console.log('No changes..');
				}
			});

		}).catch((err) =>
		{
			console.log(err);
		});
	}, intervals.minute);
};

const updateAggregateAtInterval = (interval, type) =>
{
	let apiUrls = ['https://explorer.vertcoin.org/api/getdifficulty',
		'https://explorer.vertcoin.org/api/getblockcount',
		'https://explorer.vertcoin.org/api/getnetworkhashps'];

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
			Redis.hmset('coin:vert:' + type,
				'difficulty', response[0],
				'blockheight', response[1],
				'hashpersec', response[2],
				'lastupdated', moment().unix().toString(), (err, obj) =>
				{
					if (err)
						throw err;

					console.log(obj);
				});

		}).catch((err) => {
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