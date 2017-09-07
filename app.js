var logger = require('winston');
var config = require('config');

var mongoose = require('mongoose');
mongoose.connect(config.MainDb.url);

var logUtil = require('./lib/utils/LogUtil');
logUtil.init(config.Logger);

var transactionService = require('./lib/TransactionService');
transactionService.start();