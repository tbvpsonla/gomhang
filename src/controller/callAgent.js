var SelfReloadJSON = require('self-reload-json');
var campaignContent = new SelfReloadJSON(global.rootPath + "/config/campaign/content.json");
var fbTemplate = require(global.rootPath + "/controller/botBuilderTemplate");
const config = require(global.rootPath + "/config/constants");

var User = require(global.rootPath + '/model/user.model');
var Group = require(global.rootPath + '/model/group.model');

var pushNotification = function(facebookBot, callback) {
  console.log("Message Data: " + JSON.stringify(messageData));

  var event = campaignContent.event;
  var content = event.content;
  var messageData = [];

  // Create message array
  for (var i = 0; i < content.length; i++) {
    var data = createEventContent(content[i]);
    messageData.push(data);
    console.log("MESSAGE_DATA: " + JSON.stringify(data));
  }

  // Send to group
  if (event.group) {
    var groupTitle = event.group;

    // Find all users in group
    Group.find({"title": groupTitle}).populate('users').exec()
  	.then(function(result) {
      console.log("List of users: " + JSON.stringify(result));
      if(result.length > 0) {
        var group = result[0];
        var users = group.users;
        for (var i = 0; i < users.length; i++) {
          facebookBot.doDataResponse(users[i].fbid, messageData);
        }
      }

      return callback("OK");
  	}).catch(function(err) {
    		return callback("NOT OK");
    	});
  }
  // Send to all users
  else {
    User.find({}, function(err, users) {
      if (err) return callback("NOT OK");

      console.log("List of users: " + JSON.stringify(users));
      for (var i = 0; i < users.length; i++) {
        facebookBot.doDataResponse(users[i].fbid, messageData);
      }

      return callback("OK");
    });
  }

};

var createEventContent = function(content) {
  var messageData = {"text": ""};

  switch (content.type) {
    case "text":
      var event = createText(content);
      messageData = event.template;
      break;

    case "quickReply":
      var event = createQuickReply(content);
      console.log(event)
      messageData = event;
      break;

    case "button":
      var template = createButton(content);
      messageData = event.template;
      break;

    case "generic":
      var event = createGeneric(content);
      messageData = event;
      break;
  }

  return messageData;
}

var createText = function(content) {
  var title = content.title;
  var template = new fbTemplate.Text(title);

  return template;
}

var createQuickReply = function(content) {
  var title = content.title;
  var template = new fbTemplate.Text(title);
  for(var i = 0; i < content.children.length; i++) {
    let title = content.children[i].title;
    let value = content.children[i].value;
    template
    .addQuickReply(title, value)
  }

  return template.get();
}

var createButton = function(content) {
  var title = content.title;
  var template = new fbTemplate.Button(title);
  for(var i = 0; i < content.children.length; i++) {
    let title = content.children[i].title;
    let value = content.children[i].value;
    template
    .addButton(title, value)
  }

  return template.get();
}

var createGeneric = function(content) {
  var template = new fbTemplate.Generic();
  for(var i = 0; i < content.children.length; i++) {
    let children = content.children[i];
    let title = children.title;
    let subtitle = children.subtitle;
    let imageUrl = children.image_url;
    template
    .addBubble(title, subtitle)
    .addImage(imageUrl);

    for (let button of children.buttons) {
      console.log("BUTTON: " + button);;
      let buttonTitle = button.title;
      let buttonValue = config.chatbase.CHATBASE_FACEBOOK_TAP_TO_SITES_URL + "&url=" + button.value;
      let buttonType = button.type;
      template
      .addButton(buttonTitle, buttonValue, buttonType);
    }

  }

  return template.get();
}

module.exports.pushNotification = pushNotification;
