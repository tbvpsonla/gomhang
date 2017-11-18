var SelfReloadJSON = require('self-reload-json');
var campaignContent = new SelfReloadJSON(global.rootPath + "/config/campaign/content.json");
var fbTemplate = require(global.rootPath + "/controller/botBuilderTemplate");
const constants = require(global.rootPath + "/config/constants");
var utils = require(global.rootPath + '/controller/utils/utils');

var createMessage = function(content) {
  var messageData = [];

  // Create message
  for (var i = 0; i < content.length; i++) {
    var data = createEventContent(content[i]);
    messageData.push(data);
    // console.log("MESSAGE_DATA: " + JSON.stringify(data));
  }

  return messageData;
}

var createAgentMessage = function(senderId, userId, url, data) {
  var dataString = JSON.stringify(data);
  var inboxUrl = encodeURIComponent(url);
  var encodeSenderId = encodeURIComponent(senderId);
  var encodeUserId = encodeURIComponent(userId);
  dataString = dataString.replace('INBOX_URL', process.env.API_BASE + "/redirect?inboxUrl=" + inboxUrl + "&agentId=" + encodeSenderId + "&userId="+encodeUserId);
  console.log("MESSAGE_DATA_AGENT: " + dataString);

  return JSON.parse(dataString);
}

const fbGraphApi = require(global.rootPath + "/controller/fbGraphApi");
var sendCustomMessageToGroup = function(facebookBot, userId, agents, messageId, data) {
  console.log("START SENDING MESSAGES TO " + agents.length + " AGENTS");
  fbGraphApi.getGraphConversations(messageId)
  .then(function(inboxUrl){
    console.log("URL: " + inboxUrl);
    for (var i = 0; i < agents.length; i++) {
      var messageData = createAgentMessage(agents[i].fbid, userId, inboxUrl, data);
      console.log(" => CREATE MESSAGE: " + JSON.stringify(messageData));
      console.log(" => SEND TO " + userId);
      facebookBot.doDataResponse(agents[i].fbid, messageData);
    }
  })
  .catch(function(err){
    console.log("ERROR: " + err);
  });

}

var sendMessageToGroup = function(facebookBot, group, data) {
  console.log("START SENDING MESSAGES TO " + group.length + " AGENTS");

  for (var i = 0; i < group.length; i++) {
    console.log(" => SEND TO " + group[i].fbid);
    facebookBot.doDataResponse(group[i].fbid, data);
  }
}

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
      var event = createButton(content);
      console.log("BUTTON TEMPLATE: " + JSON.stringify(event));
      messageData = event;
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
    .addButtonByType(title, value, content.children[i].type)
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
      let buttonValue = constants.chatbase.CHATBASE_FACEBOOK_TAP_TO_SITES_URL + "&url=" + button.value;
      let buttonType = button.type;
      template
      .addButton(buttonTitle, buttonValue, buttonType);
    }
  }

  return template.get();
}

module.exports.createMessage = createMessage;
module.exports.sendMessageToGroup = sendMessageToGroup;
module.exports.sendCustomMessageToGroup = sendCustomMessageToGroup;
