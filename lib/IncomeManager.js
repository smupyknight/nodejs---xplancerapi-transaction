var logger = require('winston');
var async = require('async');
var _ = require('underscore');
var Income = require('./model/Models').model('Income');
var IncomeLog = require('./model/Models').model('IncomeLog');
var incomeAction = require('./ConstDefined').IncomeAction;
var incomeUnit = require('./ConstDefined').IncomeUnit;

var update = function(uid, actionId, value, actionData, callback) {
	var value = Math.round(value);

	var query = {
		'_id': uid
	};
	var update = {
		'$inc': {
			'value': value
		}
	};

	Income.findOneAndUpdate(query, update, {new: false}, function(err, result) {
		if (err) {
			logger.error("failed to update income for user:[%s] actionId:[%s] value:[%s] actionData:[%s]", uid, actionId, value, JSON.stringify(actionData), err);
			callback(err);
			return;
		}

		if (!result) {
			logger.error("failed to find income for user:[%s]", uid);
			callback(new Error('failed to find income of user'));
			return;
		}

		var	valueBefore = result.value;
		var valueAfter = valueBefore + value;

		var blog = new IncomeLog();
		blog.uid = uid;
		blog.actionId = actionId;
		blog.value = value;
		blog.unit = incomeUnit.CENT_OF_COIN; 
		blog.valueBefore = valueBefore;
		blog.valueAfter = valueAfter;
		blog.actionData = actionData;
		blog.created = new Date().getTime();

		blog.save(function(err, res) {
			if (err) {
				logger.error("failed to create Income Log for user:[%s] actionId:[%s] value:[%s] actionData:[%s]", 
					uid, actionId, value, JSON.stringify(actionData), err);
				callback(err);
				return;
			}

			logger.info("[%s] income updated, value:[%s] valueAfter:[%s] actionId:[%s] actionData:[%s]", 
				uid, value, valueAfter, actionId, JSON.stringify(actionData));
			callback(null, valueAfter);
		});
	});
};

module.exports = {
	update: update
}

