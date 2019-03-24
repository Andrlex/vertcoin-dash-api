'use strict';

const Redis = require('../../middleware/database').client;
const moment = require('moment');

const getData = function (request, reply)
{
	let response = { recent: { } };

	Redis.hmget([
		'coin:vert',
		'difficulty',
		'blockheight',
		'hashpersec',
		'lastupdated',
		'nextblockhalve'], (err, obj) =>
	{
		response.recent.difficulty = obj[0];
		response.recent.blockHeight = obj[1];
		response.recent.hashPerSec = Number(obj[2] / 1000000000);
		response.lastUpdated = obj[3];
		response.timeTillHalve = obj[4];

		reply(response);
		// Redis.hmget([
		// 	'coin:vert:hour',
		// 	'difficulty',
		// 	'blockheight',
		// 	'hashpersec'], (err, obj) =>
		// {
		// 	response.hour.difficulty = obj[0];
		// 	response.hour.blockHeight = obj[1];
		// 	response.hour.hashPerSec = Number(obj[2] / 1000000000);
		//
		// 	Redis.hmget([
		// 		'coin:vert:day',
		// 		'difficulty',
		// 		'blockheight',
		// 		'hashpersec'], (err, obj) =>
		// 	{
		// 		response.day.difficulty = obj[0];
		// 		response.day.blockHeight = obj[1];
		// 		response.day.hashPerSec = Number(obj[2] / 1000000000);
		//
		// 		Redis.hmget([
		// 			'coin:vert:week',
		// 			'difficulty',
		// 			'blockheight',
		// 			'hashpersec'], (err, obj) =>
		// 		{
		// 			response.week.difficulty = obj[0];
		// 			response.week.blockHeight = obj[1];
		// 			response.week.hashPerSec = Number(obj[2] / 1000000000);
		//
		// 			reply(response);
		// 		});
		// 	});
		// });
	});
};

module.exports = {
	getData: getData
};