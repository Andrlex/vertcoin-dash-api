'use strict';

const vtcAggregateController = require('../controllers/vtc.aggregate.controller');

const routes = function ()
{
	return {
		chainData: chainData()
	};

	function chainData()
	{
		return {
			method: 'GET',
			path: '/api/chain',
			handler: vtcAggregateController.getData(),
			config: {
				cors: {
					origin: '*'
				}
			}
		};
	}
};

module.exports = {
	routes: routes()
};