const redis = require('redis')
const client = redis.createClient();
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = process.env.LOG_LEVEL;
//Incase any error pops up, log it
client.on("error", function(err) {
  logger.debug('Redis server connection fail' + err);
});
client.on('connect', function() {
  logger.debug('Redis server connection successfully');
});

module.exports = client;
