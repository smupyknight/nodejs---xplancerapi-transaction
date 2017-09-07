var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;

/*
 * 用户余额
 */
var balance = new Schema({
    _id: Number,
    value: Number,
    unit: Number,
}, {collection:'balance'});

/*
 * 用户收入
 */
var income = new Schema({
    _id: Number,
    value: Number,
    unit: Number,
}, {collection:'income'});

/*
 * 用户购买点数记录，用做交易依据
 */
var purchase = new Schema({
    uid: Number,
    product_id: String,
    channel: Number,
    status: String,
    end_time: String,
    balanced: Boolean
}, {
    collection: 'purchase'
});

var gift = new Schema({
    type: Number,
    name: String,
    value: Mixed,
    available: Boolean
}, {collection: 'gift'});

var presentation = new Schema({
    gid: String,
    from: Number,
    to: Number,
    serial: Number,
    balanced: Boolean
}, {collection: 'presentation'});

/*
 * 用户余额变更记录，用于审计和查询明细
 */
var balanceLog = new Schema({
	uid: Number,
	action: Number,
	value: Number,
	unit: Number,
	value_before: Number,
	value_after: Number,
	actionData: Mixed,
	created: Number
}, {
	collection: 'balance_log'
});

/*
 * 用户收入变更记录，用于审计和查询明细
 */
var incomeLog = new Schema({
	uid: Number,
	action: Number,
	value: Number,
	unit: Number,
	valueBefore: Number,
	valueAfter: Number,
	actionData: Mixed,
	created: Number
}, {
	collection: 'income_log'
});


mongoose.model('Balance', balance);
mongoose.model('Income', income);
mongoose.model('Purchase', purchase);
mongoose.model('Gift', gift);
mongoose.model('Presentation', presentation);
mongoose.model('BalanceLog', balanceLog);
mongoose.model('IncomeLog', incomeLog);

module.exports = mongoose;

