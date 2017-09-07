var logger = require('winston');
var _ = require('underscore');
var async = require('async');
var Purchase = require('./model/Models').model('Purchase');
var Presentation = require('./model/Models').model('Presentation');
var Gift = require('./model/Models').model('Gift');
var balanceAction = require('./ConstDefined').BalanceAction;
var incomeAction = require('./ConstDefined').IncomeAction;
var balanceManager = require('./BalanceManager');
var incomeManager = require('./IncomeManager');

var scanPurchaseLogs = function(callback) {
	Purchase.find({
		status: 'SUCCESS', 
		balanced: null
	}).lean().exec(function(err, res) {
		if (err) {
			callback(err);
			return;
		}

		logger.info('scanPurchaseLogs', JSON.stringify(res));

		async.map(res, executePurchaseTransaction, function(err, res) {
			if (err) {
				callback(err);
				return;
			}

			//去掉没有更新的记录
			res = _.reject(res, function(r){ return r == null || r == undefined})
			callback(null, res);
		});
	});
}

var scanPresentationLogs = function(callback) {
	Presentation.find({
		balanced: null
	}).lean().exec(function(err, res) {
		if (err) {
			callback(err);
			return;
		}

		logger.info('scanPresentationLogs', JSON.stringify(res));

		async.map(res, executePresentationTransaction, function(err, res) {
			if (err) {
				callback(err);
				return;
			}

			//去掉没有更新的记录
			res = _.reject(res, function(r){ return r == null || r == undefined})
			callback(null, res);
		});
	});
}

var executePresentationTransaction = function(presentation, callback) {
	Gift.findOne({'_id': presentation.gid}).lean().exec(function(err, gift){
		if (err) {
			callback(err);
			return;
		}

		var presentId = presentation._id.toString();

		async.parallel([
			function(cb){
				var actionData = {
					presentId: presentId,
					gid: presentation.gid,
					to: presentation.to
				};

				var value = -100 * gift.value.points;
				balanceManager.update(presentation.from, balanceAction.PRESENTATION, value, actionData, function(err, balance_after){
					var data = {
						uid: presentation.from,
						presentId: presentId,
						value: value,
						balance: balance_after
					};
					data.success = err ? false: true; //如果更新有错, 不callback error, 而是在返回数据中表示这个数据有错。如果callback 这个error，会导致上层的map 流程终止

					cb(null, data);
				});
			},
			function(cb){
				var actionData = {
					presentId: presentId,
					gid: presentation.gid,
					from: presentation.from
				};

				var value = 100 * gift.value.coins;
				incomeManager.update(presentation.to, incomeAction.PRESENTATION, value, actionData, function(err, income_after){
					var data = {
						uid: presentation.to,
						presentId: presentId,
						value: value,
						income: income_after
					};
					data.success = err ? false: true;

					cb(null, data);
				});
			}
		], function(err, results){
			if (!err) {
				var query = {
					'_id': presentId
				};
				var update = {'$set': {'balanced': true}}

				Presentation.findOneAndUpdate(query, update).lean().exec(function(err, result) {
					// 需要改成 batch operation，同步更改 balance 表，trades 表等，才能完全避免出现
					if (err) {
						log.err('update balance & income success but mark presentation %s balanced failed with error %s', presentId, err);
					}

					callback(null, data);
				});
			} else {
				callback(null, data);
			}
		});
	});;
}

var executePurchaseTransaction = function(purchase, callback) {
	Products.findOne({'_id': purchase.product_id}).lean().exec(function(err, product){
		if (err) {
			callback(err);
			return;
		}

		//uid, actionId, amount, actionData, callback
		var purchaseId = purchase._id.toString();

		var actionData = {
			purchaseId: purchaseId,
			productId: purchase.product_id,
			channel: purchase.channel,
			channelTradeId: purchase.channel_tradeId
		};

		var value = 100 * product.point;
		balanceManager.update(purchase.uid, balanceAction.PURCHASE, value, actionData, function(err, balance_after){
			var data = {
				uid: purchase.uid,
				purchaseId: purchaseId,
				value: value,
				balance: balance_after
			};
			data.success = err ? false: true;

			if (!err) {
				var query = {
					'_id': purchaseId
				};
				var update = {'$set': {'balanced': true}}

				Purchase.findOneAndUpdate(query, update).lean().exec(function(err, result) {
					// 需要改成 batch operation，同步更改 balance 表，trades 表等，才能完全避免出现
					if (err) {
						log.err('update %s balance success but mark purchase %s balanced failed with error %s', purchase.uid, purchaseId, err);
					}

					callback(null, data);
				});
			} else {
				callback(null, data);
			}
		});
	});
}

module.exports = {
	scanPurchaseLogs: scanPurchaseLogs,
	scanPresentationLogs: scanPresentationLogs
}
