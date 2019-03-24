'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const Redis = require('../middleware/database').client;
const vertcoin = require('node-vertcoin/lib');
const Request = Bluebird.promisifyAll(require('request'), {multiArgs: true});

const moment = require('moment');

let intervals = {
	minute: {
		iterations: 1,
		interval: 60000,
		obj: {}
	},
	hour: {
		iterations: 1,
		interval: 3600000,
		obj: {}
	},
	day: {
		iterations: 1,
		interval: 86400000,
		obj: {}
	},
	week: {
		iterations: 1,
		interval: 604800000,
		obj: {}
	},
	month: {
		iterations: 4,
		interval: 604800000,
		obj: {}
	},
	year: {
		iterations: 52,
		interval: 604800000,
		obj: {}
	}
};

/**
 */
const startIngest = () =>
{
	aggregateNodeData();
	// getIntervals('minute');
	// getIntervals('day');
	// getIntervals('hour');
	// getIntervals('week');
	// getIntervals('month');
	// getIntervals('year');
	//
	// aggregateData();
	timeTillBlockHalving();
};

const resetInterval = (type) =>
{
	console.log('resetting ' + type + ' update interval');
	intervals[type].obj = updateAggregateAtInterval(intervals[type].interval, type);

};

const getIntervals = (type) =>
{
	Redis.hmget([
		'coin:vert:' + type,
		'lastupdated'], (err, obj) =>
	{
		let lastUpdated = moment.unix(obj[0]),
			secondsAgo = moment().diff(lastUpdated, 'seconds'),
			timeIntoInterval = (secondsAgo * 1000);

		if (intervals[type].interval - timeIntoInterval <= 0)
			intervals[type].obj = updateAggregateAtInterval(0, type);
		else
			intervals[type].obj = updateAggregateAtInterval(intervals[type].interval - timeIntoInterval, type);

		console.log(type + ' update will take place in ' + ((((((intervals[type].interval - timeIntoInterval) / 1000) / 60) / 60) / 24) * intervals[type].iterations) + ' days');

	});
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
					'nextblockhalve', (estimatedDaysUntilNext * 24), (err, obj) => {

						if (err)
							throw err;

					});
			});
		});

	}, 30000);
};

const aggregateNodeData = () =>
{
	let client = new vertcoin.Client({
		host: 'localhost',
		port: 5888,
		user: 'rpc',
		pass: 's0p3rs3cr3t'
	});

	let aggregatedData =
		{
			nodeCount: 'getconnectioncount',
			miningInfo: 'getmininginfo'
		};

	setInterval(() =>
	{
		let ds = [];

		_.forOwn(aggregatedData, function (value, key)
		{
			client.cmd(aggregatedData[key], function(err, response)
			{
				// only propagate results if they're all defined
				if (response !== undefined)
				{
					ds.push({type: key, data: response});

					if (ds.length === Object.keys(aggregatedData).length)
						saveAggregatedData(ds);
				}
				else
					console.log('undefined value found for' + key);
			});
		});
	}, (intervals.minute.interval));

};

const saveAggregatedData = (data) =>
{
	if (data[1].data.difficulty === undefined || data[1].data.networkhashps === undefined ||
		data[1].data.blocks === undefined)
	{
		console.log('undefined values found');
		return;
	}

	Redis.hmset('coin:vert',
		'difficulty', data[1].data.difficulty,
		'blockheight', data[1].data.blocks,
		'hashpersec', data[1].data.networkhashps,
		'lastupdated', moment().unix().toString(), (err, obj) => {
			if (err)
				throw err;

			console.log(obj);
		});
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
	}, 3000);
};

const updateAggregateAtInterval = (interval, type) =>
{
	let apiUrls = ['https://explorer.vertcoin.org/api/getdifficulty',
		'https://explorer.vertcoin.org/api/getblockcount',
		'https://explorer.vertcoin.org/api/getnetworkhashps'];

	return setInterval(() =>
	{
		clearInterval(intervals[type].obj);

		Redis.hmget([
			'coin:vert:' + type,
			'iterations'], (err, obj) =>
		{
			if (err)
				return false;

			let currentIterations = obj[0],
				iterationsValue = (currentIterations > 0) ? (currentIterations - 1) : intervals[type].iterations;

			Redis.hmset('coin:vert:' + type,
				'iterations', iterationsValue, (err, obj) => {

					if (err)
					{
						intervals[type].obj = null;
						console.log('killed interval ' + type);

						throw err;
					}

					console.log('updated iterations of ' + type + ' to ' + iterationsValue);

					if (iterationsValue === 0)
					{
						Bluebird.map(apiUrls, (url) => {
							return Request.getAsync(url).spread((response, body) => {
								return JSON.parse(body);
							});
						}).then((response) => {
							Redis.hmset('coin:vert:' + type,
								'difficulty', response[0],
								'blockheight', response[1],
								'hashpersec', response[2],
								'lastupdated', moment().unix().toString(), (err, obj) => {
									if (err) {
										intervals[type].obj = null;
										console.log('killed interval ' + type);

										throw err;
									}

									console.log('computing ' + type + ' update');
								});

						}).catch((err) => {
							console.log(err);
						});
					}

					resetInterval(type);
				});
		});


	}, interval);
};

/**
 * @type {{startIngest: (function())}}
 */
module.exports = {
	startIngest: startIngest
};