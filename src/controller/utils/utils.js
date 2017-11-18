const cache = require(global.rootPath + "/controller/cache");

var readFile = function(filePath , callbackReadFile){
  var fs = require('fs');
  fs.readFile(filePath, function (err,data) {
    if (err) {
      logger.debug(err);
    }
    callbackReadFile(err, JSON.parse(data));
  });
}

var convertFromMinuteToTime = function(time) {
  var object = {
    "hour": "*",
    "minute": "*",
    "second": "*"
  }

  var hour = Math.floor(time / 60);
  if (hour != 0) {
    object.hour = hour;
  }

  time = time - hour * 60;
  var minute = Math.floor(time);
  if (minute != 0) {
    object.minute = minute;
  }

  time = time - minute;
  if (time != 0) {
    object.second = time * 60;
  }

  return object;
}

var createCronTimeFromMinute = function(minutes) {
  var time = convertFromMinuteToTime(minutes);
  return time.second + " " + time.minute + " " + time.hour + " " + "* * *";
}

var updateValues = (json , senderId) => {
  return new Promise((resolve, reject) => {
    cache.hgetall("id=" + senderId, (err, value) => {
      let cacheValue = {} ;
      if(value) cacheValue = value ;
      for(let key in json) {
        cacheValue["" + key] = "" + json[key];
      }
      cache.hmset("id=" + senderId, cacheValue ,function(err, res){
        if(err) resolve(err);
        resolve("success");
      });
    });
  });
}
var getValueInRedis = (senderId , field) => {
  return new Promise((resolve, reject) => {
    cache.hgetall("id=" + senderId, (err, value) => {
      if(err) reject();
      if(value && value[field]){
        resolve(value[field]);
      }
      else reject();
    });
  });
}

module.exports = {
  createCronTimeFromMinute: createCronTimeFromMinute,
  getValueInRedis: getValueInRedis,
  updateValues : updateValues,
  readFile : readFile
};
