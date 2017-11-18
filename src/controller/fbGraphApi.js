const request = require('request');
var getGraphConversations = (messageId) => {
  var url_graph = process.env.FB_GRAPH_URL.replace("PAGE_ID", process.env.PAGE_ID) + process.env.FB_PAGE_ACCESS_TOKEN;
  console.log("URL: " + url_graph);
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: url_graph
    },
    (error, response, body) => {
      if (error) {
        console.error('Error while Get Information User: ', error);
        reject(error);
      } else {
        var object = JSON.parse(response.body).data;
        for (var i in object) {
          var item = object[i];
          var messages = item.messages.data;
          for (var j in messages) {
            if (messages[j].id == messageId) {
              console.log("Found this: " + messages[j].id);
              resolve("https://www.facebook.com" + item.link);
            }
          }
        }
        resolve("");
      }
    });
  });
}

module.exports.getGraphConversations = getGraphConversations;
