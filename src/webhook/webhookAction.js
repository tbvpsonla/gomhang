var validator = require(global.rootPath + "/controller/validator");
var campaign = require(global.rootPath + "/controller/campaign");
var utils = require(global.rootPath + '/controller/utils/utils');
var logger = require(global.rootPath + '/controller/logger');
var constant = require(global.rootPath + "/config/constants");
var facebookRequest = require(global.rootPath + "/controller/facebookRequest");
var dbController = require(global.rootPath + "/controller/databaseController");
var emailController = require(global.rootPath + "/controller/emailController");
var reportController = require(global.rootPath + "/controller/reportController");

// var User = require(global.rootPath + '/model/user.model');
// var Group = require(global.rootPath + '/model/group.model');

exports.webhook = function(req, res, facebookBot) {
    var body = req.body;
    var action = body.result.action;
    var senderId = body.originalRequest.data.sender.id;
    console.log("Body: " + JSON.stringify(body));
    console.log("Action: " + action);
    switch (action) {

        case "facebook-welcome":
            facebookBot.getFBinformation(senderId)
            .then(function(result){
                var fbName = result.first_name + " " + result.last_name;

                var query = {
                    "collection_name": "User",
                    "condition": {
                        fb_id : senderId
                    },
                    "data": {fb_id: senderId, fb_name: fbName}
                }
                dbController.findOneAndUpdate(query).then(function(result){
                    var event = {
                       "followupEvent": {
                          "name": "GREETING",
                          "data": {
                             "name": fbName
                          }
                       }
                    }

                return res.status(200).json(event);
                });


            }).catch(function(error){
                logger.debug("Error Get FB User Info: " + error);
            });
            break;

        case "validate-order":
            var query = {
                "collection_name": "User",
                "condition": {
                    fb_id : senderId
                }
            }
            dbController.find(query).then(function(result){
                // logger.debug("User Name exists: " + JSON.stringify(result));
                if (result && result.length > 0){
                    if (!result[0].name) {
                        var event = {
                           "followupEvent": {
                              "name": "ASK_NAME",
                              "data": {
                              }
                           }
                        }
                    }else if (!result[0].phone){
                        var event = {
                           "followupEvent": {
                              "name": "ASK_PHONE",
                              "data": {
                              }
                           }
                        }
                    } else if (!result[0].address) {
                        var event = {
                           "followupEvent": {
                              "name": "ASK_ADDRESS",
                              "data": {
                              }
                           }
                        }
                    } else {
                        var event = {
                           "followupEvent": {
                              "name": "ASK_PRODUCT",
                              "data": {
                              }
                           }
                        }
                    }
                }

                return res.status(200).json(event);
            });
            break;

        case "validate-name":
            var query = {
                "collection_name": "User",
                "condition": {
                    fb_id : senderId
                },
                "data": {name: body.result.parameters.name}
            }
            dbController.update(query).then(function(result){
                var event = {
                       "followupEvent": {
                          "name": "ASK_PHONE",
                          "data": {

                          }
                       }
                    }
                return res.status(200).json(event);
            })

            break;

        case "validate-phone":
            var phone = body.result.parameters.phone;
            logger.debug("Input phone: " + phone);
            validator.validate(constant.validator.PHONE_TYPE, phone, function(result){
                logger.debug("Validate Phone Result: " + JSON.stringify(result));
                if (result.status) {
                    var query = {
                        "collection_name": "User",
                        "condition": {
                            fb_id : senderId
                        },
                        "data": {phone: phone}
                    }
                    dbController.findOneAndUpdate(query).then(function(result){
                        var event = {
                           "followupEvent": {
                              "name": "ASK_ADDRESS",
                              "data": {

                              }
                           }
                        }

                        return res.status(200).json(event);
                    });
                } else {
                    var event = {
                       "followupEvent": {
                          "name": "ASK_PHONE_WRONG",
                          "data": {

                          }
                       }
                    }

                    return res.status(200).json(event);
                }

            });
            break;
        case "validate-address":
            var address = body.result.parameters.address;
            var query = {
                "collection_name": "User",
                "condition": {
                    fb_id : senderId
                },
                "data": {address: address}
            }
            dbController.findOneAndUpdate(query).then(function(result){
                logger.debug("Result: " + JSON.stringify(result));
                var event = {
                   "followupEvent": {
                      "name": "ASK_PRODUCT",
                      "data": {
                      }
                   }
                }

                return res.status(200).json(event);
            });

        break;
        case "validate-product":
            var product = body.result.parameters.product;
            var query = {
                "collection_name": "User",
                "condition": {
                    fb_id : senderId
                }
            }
            dbController.find(query).then(function(result){
              var event = {
                 "followupEvent": {
                    "name": "ORDER_CONFIRM",
                    "data": {
                       name: result[0].name,
                       address: result[0].address,
                       phone: result[0].phone,
                       product: product,
                       senderId: senderId
                    }
                 }
              }

              return res.status(200).json(event);
            }).then(function(err){
              var event = {
                 "followupEvent": {
                    "name": "ORDER_CONFIRM",
                    "data": {
                       name: "",
                       address: "",
                       phone: "",
                       product: product,
                       senderId: senderId
                    }
                 }
              }
              return res.status(200).json(event);
            });

            break;
        case "send-order":
            var product = body.result.parameters.product;
            var payload = body.result.fulfillment.messages[0].payload;
            var contextArr = body.result.contexts;
            var context;
            var context = contextArr.find(context=>context.name=="order-confirm-followup");
            var orderInfo = {
              name: context.parameters.name,
              phone: context.parameters.phone,
              address: context.parameters.address,
              product: context.parameters.product,
              senderId: senderId
            }
            var event = {
               "followupEvent": {
                  "name": "ORDER_SUCCESS",
                  "data": {
                  }
               }
            }
            logger.debug("Email Content: " + JSON.stringify(payload));

            // Save order in DB
            emailController.sendEmail(payload.email);
            dbController.insertOrder(orderInfo).then(function(){
              logger.debug("Insert Order Success");
              return res.status(200).json(event);
            }).catch(function(err){
              logger.debug("Insert Order Fail: " + JSON.stringify(err));
              return res.status(200).json(event);
            });

            break;

        case "create_report":
            var reportTime = body.result.parameters.time;
            var payload = body.result.fulfillment.messages[0].payload;
            reportController.reportOrder(payload.email);
            break;
        case "call_agent":
            senderId = body.originalRequest.data.sender.id;
            console.log("SENDER ID: " + senderId);
            utils.getValueInRedis(senderId, constant.field.FIELD_MESSAGE_ID).then(function(messageId) {
              console.log("START CALL AGENT WITH \n" + JSON.stringify(messageId));
              campaign.notifyAgent(facebookBot, senderId, messageId, function (result) {
                  campaign.scheduleTaskByTime(facebookBot, senderId);
              });
            }).catch(function(err){
                logger.debug("Error: " + err);
            });
            return res.status(200).json({});
            break;
        case "call_agent_accept":
            senderId = body.originalRequest.data.sender.id;
            var userId = body.result.parameters.userId;
            console.log("AGENT ACCEPT USER " + userId);
            campaign.agentAccept(facebookBot, senderId, userId, function (result) {
            });
            return res.status(200).json({});
            break;
        default:
            return res.status(200).json({});
            break;
    }
}
