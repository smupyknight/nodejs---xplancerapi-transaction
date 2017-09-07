var logger = require('winston');
var async = require('async');
var _ = require('underscore');
var transactionManager = require('./TransactionManager');

var timeoutHandler = null;

var intervalMs = 5000; 

var start = function() {
    if (!timeoutHandler){
        logger.info('TransactionService started'); 

        startSync(scheduleNextSync);
    } else {
        logger.info("sync already scheduled");
    }
}

var stop = function(){
    if (timeoutHandler){
        clearTimeout(timeoutHandler);
        logger.info('TransactionService stopped');
    }
}

var scheduleNextSync = function(){
    timeoutHandler = setTimeout(function(){startSync(scheduleNextSync)}, intervalMs);
}

var startSync = function(callback){
    var start = new Date().getTime();

    async.parallel([
        function(callback){
            transactionManager.scanPurchaseLogs(function(err, res) {
                if (err) {
                    logger.error('failed to update from purchase logs', err);
                    callback(null); // do not throw error up
                    return;
                }

                var duration = new Date().getTime() - start;

                var num = res? res.length: 0;

                if (num > 0){
                    logger.info('update balance from purchase logs  num:[%s] elapsed:[%s]ms data:%s', num, duration, JSON.stringify(res));
                } else {
                    logger.debug('update balance from purchase logs  num:[%s] elapsed:[%s]ms', num, duration);
                }

                callback(null);
            });
        },
        function(callback) {
            transactionManager.scanPresentationLogs(function(err, res) {
                if (err) {
                    logger.error('failed to update from presentation logs', err);
                    callback(null); // do not throw error up
                    return;
                }

                var duration = new Date().getTime() - start;

                var num = res? res.length: 0;

                if (num > 0){
                    logger.info('update from presentation logs num:[%s] elapsed:[%s]ms data:%s', num, duration, JSON.stringify(res));
                } else {
                    logger.debug('update from presentation logs  num:[%s] elapsed:[%s]ms', num, duration);
                }

                callback(null);
            });
        }
    ],
    function(err, results) {
        callback();
    });
}

module.exports = {
	start: start,
	stop: stop
}
