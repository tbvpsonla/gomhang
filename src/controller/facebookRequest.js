const request = require('request');
var logger = require(global.rootPath + '/controller/logger');
var constant = require(global.rootPath + "/config/constants");

// exports.information = (userID) => {
//   var url_graph = "https://graph.facebook.com/v2.8/" + userID + "?fields=first_name,last_name&access_token=" + process.env.FB_PAGE_ACCESS_TOKEN;
//   return new Promise((resolve, reject) => {
//     request({
//       method: 'GET',
//       uri: url_graph
//     },
//     (error, response, body) => {
//       if (error) {
//         console.error('Error while Get Information User : ', error);
//         reject(error);
//       } else {
//         logger.debug('Information result: ', response.body);
//         resolve(JSON.parse(response.body));
//       }
//     });
//   });
// }
// exports.deleteMenu = () => {

//   request({
//     method: 'DELETE',
//     uri: constant.FB_THREAD_URL + process.env.FB_PAGE_ACCESS_TOKEN,
//     json: require(global.dir + "/config/json/deletePersistentMenu.json")
//   },
//   (error, response, body) => {
//     if (error) {
//       console.error('Error while Delete Menu : ', error);
//     } else {
//       logger.debug('Delete Menu result: ', response.body);
//     }
//   });
// }

// exports.subscribe = () => {

//   request({
//     method: 'POST',
//     uri: constant.FB_SUBSCRIBED_URL + process.env.FB_PAGE_ACCESS_TOKEN
//   },
//   (error, response, body) => {
//     if (error) {
//       console.error('Error while subscription: ', error);
//     } else {
//       logger.debug('Subscription result: ', response.body);
//     }
//   });
// }

// exports.greeting = () => {

//   request({
//     method: 'POST',
//     uri: constant.FB_THREAD_URL + process.env.FB_PAGE_ACCESS_TOKEN,
//     json: require(global.dir + "/config/json/greeting.json")
//   },
//   (error, response, body) => {
//     if (error) {
//       console.error('Error while Create Greeting : ', error);
//     } else {
//       logger.debug('Greeting result: ', response.body);
//     }
//   });
// }

exports.getStarted = () => {

  request({
    method: 'POST',
    uri: constant.facebook.FB_PROFILE_URL + process.env.FB_PAGE_ACCESS_TOKEN,
    json: {
            "get_started":{
              "payload":"get_started"
            }
          }
  },
  (error, response, body) => {
    if (error) {
      console.error('Error while Create Started : ', error);
    } else {
      logger.debug('Started result: ', response.body);
    }
  });
}

// exports.menu = () => {

//   request({
//     method: 'POST',
//     uri: constant.FB_PROFILE_URL + process.env.FB_PAGE_ACCESS_TOKEN,
//     json: require(global.dir + "/config/json/persistentMenu.json")
//   },
//   (error, response, body) => {
//     if (error) {
//       console.error('Error while Create Menu : ', error);
//     } else {
//       logger.debug('Menu result: ', response.body);
//     }
//   });
// }
