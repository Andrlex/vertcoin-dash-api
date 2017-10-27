'use strict';

const Redis = require('../../middleware/database').client;
const moment = require('moment');

const getData = function (request, reply)
{
	let response = {};

	Redis.hmget([
		'coin:vert',
		'difficulty',
		'blockheight',
		'hashpersec',
		'lastupdated'], (err, obj) =>
	{
		response.difficulty = obj[0];
		response.blockHeight = obj[1];
		response.hashPerSec = obj[2];
		response.lastUpdated = obj[3];

		reply(response);
	});
};

module.exports = {
	getData: getData
};