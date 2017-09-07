var logger = require('winston');
var async = require('async');
var _ = require('underscore');
var Balance = require('./model/Models').model('Balance');
var BalanceLog = require('./model/Models').model('BalanceLog');
var balanceAction = require('./ConstDefined').BalanceAction;
var balanceUnit = require('./ConstDefined').BalanceUnit;

var update = function(uid, actionId, value, actionData, callback) {
	var value = Math.round(value)

	var query = {
		'_id': uid
	};
	var update = {
		'$inc': {
			'value': value
		}
	};

	Balance.findOneAndUpdate(query, update, {new: false}, function(err, result) {
		if (err) {
			logger.error("failed to update balance for user:[%s] actionId:[%s] value:[%s] actionData:[%s]", uid, actionId, value, JSON.stringify(actionData), err);
			callback(err);
			return;
		}

		if (!result) {
			logger.error("failed to find balance for user:[%s]", uid);
			callback(new Error('failed to find balance of user'));
			return;
		}

		var	valueBefore = result.value;
		var valueAfter = valueBefore + value;

		var blog = new BalanceLog();
		blog.uid = uid;
		blog.actionId = actionId;
		blog.value = value;
		blog.unit = balanceUnit.CENT_OF_POINT;
		blog.valueBefore = valueBefore;
		blog.valueAfter = valueAfter;
		blog.actionData = actionData;
		blog.created = new Date().getTime();

		blog.save(function(err, res) {
			if (err) {
				logger.error("failed to create Balance Log for user:[%s] actionId:[%s] value:[%s] actionData:[%s]", uid,
					actionId, value, JSON.stringify(actionData), err);
				callback(err);
				return;
			}

			logger.info("[%s] balance updated, value:[%s] valueAfter:[%s] actionId:[%s] actionData:[%s] ", 
				uid, value, valueAfter, actionId, JSON.stringify(actionData));
			callback(null, valueAfter);
		});
	});
};

module.exports = {
	update: update
}