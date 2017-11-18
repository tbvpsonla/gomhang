var SelfReloadJSON = require('self-reload-json');
var campaignContent = new SelfReloadJSON(global.rootPath + "/config/campaign/content.json");
var event = campaignContent.event;
var campaignHelper = require(global.rootPath + '/controller/campaignHelper');
var utils = require(global.rootPath + '/controller/utils/utils');
var constant = require(global.rootPath + "/config/constants");
var User = require(global.rootPath + '/model/user.model');
var Group = require(global.rootPath + '/model/group.model');

var CronJobManager = require('cron-job-manager');
cronManager = new CronJobManager();

var scheduleTaskByTime = function(facebookBot, senderId) {
  var time = event.time;
  // console.log("Number of cron: " );
  if (time) {
    var cronTime = utils.createCronTimeFromMinute(time);
    // console.log("Cron Time converted: " + cronTime);
    cronManager.add(senderId, cronTime, function(){
      // console.log("Start Cron " + senderId);
      facebookBot.sendFBMessage(senderId, {"text": event.fail});
      cronManager.deleteJob(senderId);
    }, {
      start: true,
      completion: function() {
        console.log("Stop Cron " + senderId)
      }
    });
  } else {
    var messageData = campaignHelper.createMessage(event.user);
    // // console.log("MESSAGE DATA: " + JSON.stringify(messageData));
    facebookBot.doDataResponse(senderId, messageData);
  }

}

var agentAccept = function(facebookBot, agentId, senderId, callback) {
  // Check existence of Cron
  var time = event.time;
  if (time) {
    console.log("First Time");
    if (cronManager.exists(senderId)) {
        console.log("Cron Sender Exists");
        cronManager.deleteJob(senderId);
        // Notify user
        facebookBot.sendFBMessage(senderId, {"text": event.success});

        // Notify agents
        Group.find({"title": "Admin"}).populate('users').exec()
        .then(function(result) {
          console.log("List of users: " + JSON.stringify(result));
          if(result.length > 0) {
            var notification = "*agent_name* (Agent) *helps* *user_name* (User)";
            console.log("AGENT ID: " + agentId);
            utils.getValueInRedis(agentId, constant.field.FIELD_NAME).then(function(agentName){
              // console.log("Agent Name: " + agentName);
              notification = notification.replace("agent_name", agentName);
              utils.getValueInRedis(senderId, constant.field.FIELD_NAME).then(function(userName){
                // console.log("User Name: " + userName);
                notification = notification.replace("user_name", userName);
                campaignHelper.sendMessageToGroup(facebookBot, result[0].users, {"text": notification});
              }).catch();
            }).catch();
          }
        }).catch(function(err) {
          console.log("AGENT ACCEPT ERROR: " + err);;
        });
    }
  } else {
    console.log("Second Time");
    facebookBot.sendFBMessage(senderId, {"text": event.success});
  }
}

var notifyAgent = function(facebookBot, senderId, messageId, callback) {
  var content = event.admin;

  // Create message
  // console.log("Well TO HERE");
  var messageData = campaignHelper.createMessage(content);
  // console.log("CREATE MESSAGES WITH CONTENT: \n" + JSON.stringify(messageData));

  // Send to group
  if (event.group) {
    var groupTitle = event.group;

    // Find all users in group
    Group.find({"title": groupTitle}).populate('users').exec()
  	.then(function(result) {
      // console.log("List of users: " + JSON.stringify(result));
      if(result.length > 0) {
        campaignHelper.sendCustomMessageToGroup(facebookBot, senderId, result[0].users, messageId, messageData);
        // console.log("FINISH PUSH MESSAGE TO AGENT\n");
      }

      return callback("OK");
  	}).catch(function(err) {
  		return callback("NOT OK");
  	});
  }
};

// var pushNotification = function(facebookBot, callback) {
//   var event = campaignContent.event;
//   var content = event.content;
//   var messageData = [];
//
//   // Create message array
//   var messageData = campaignHelper.createMessage(content);
//
//   // Send to group
//   if (event.group) {
//     var groupTitle = event.group;
//
//     // Find all users in group
//     Group.find({"title": groupTitle}).populate('users').exec()
//   	.then(function(result) {
//       // console.log("List of users: " + JSON.stringify(result));
//       if(result.length > 0) {
//         campaignHelper.sendCustomMessageToGroup(result[0].users, messageData);
//       }
//
//       return callback("OK");
//   	}).catch(function(err) {
//   		return callback("NOT OK");
//   	});
//   }
//   // Send to all users
//   else {
//     User.find({}, function(err, users) {
//       if (err) return callback("NOT OK");
//
//       // console.log("List of users: " + JSON.stringify(users));
//       campaignHelper.sendCustomMessageToGroup(users, messageData);
//
//       return callback("OK");
//     });
//   }
// };

// var jumpToIntent = function(facebookBot, text, senderId) {
//   facebookBot.jumpToIntent(text, senderId);
// }

module.exports.notifyAgent = notifyAgent;
module.exports.agentAccept = agentAccept;
module.exports.scheduleTaskByTime = scheduleTaskByTime;
