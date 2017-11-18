'use strict';
const request = require('request');
const config = require(global.rootPath + "/config/constants");
const CHATBASE_VERSION = '1.00';
const IS_FEEDBACK_MESSAGE = false;
module.exports = {
    sendFacebookMessage: sendFacebookMessage,
    sendFacebookMessageBatch: sendFacebookMessageBatch,
    sendMessageFeedback: sendMessageFeedback
}

/**
 * Send Chatbase messages received from Facebook.
 * @param senderId - <required> the ID of the end-user.
 * @param recipientId - <required> the ID of bot (Page ID).
 * @param message - <optional> the raw message body.
 * @param itent - request body data which send to chatbase.
 * @param timeStamp - <required> milliseconds since the UNIX epoch, used to sequence messages.
 * @param isHandled - bool, <optional> indicates that the agent was not able to handle the message
 *                    because it was not understood.
 */
function sendFacebookMessage(senderId, recipientId, message, intent, timeStamp, isHandled) {
    const data = {
        "sender": { "id": senderId },
        "recipient": { "id": recipientId },
        "timestamp": timeStamp.valueOf(),
        "message": {
            "text": message
        },
        "chatbase_fields": {
            "intent": intent,
            "version": CHATBASE_VERSION,
            "not_handled": !isHandled,
            "feedback": IS_FEEDBACK_MESSAGE
        }
    };
    sendToChatbase(config.chatbase.CHATBASE_FACEBOOK_MESSAGE, data);
}

/**
 * Send Chatbase messages received from Facebook.
 * @param senderId - <required> the ID of the end-user.
 * @param recipientId - <required> the ID of bot (Page ID).
 * @param messages - <optional> the array of raw message body.
 * @param itent - request body data which send to chatbase.
 * @param timeStamp - <required> milliseconds since the UNIX epoch, used to sequence messages.
 * @param isHandled - bool, <optional> indicates that the agent was not able to handle the message
 *                    because it was not understood.
 */
function sendFacebookMessageBatch(senderId, recipientId, messages, intent, timeStamp, isHandled) {

    if (!messages || messages.length == 0) {
        return;
    }
    const dataArr = [];
    messages.forEach(message => {
        const data = {
            "sender": { "id": senderId },
            "recipient": { "id": recipientId },
            "timestamp": timeStamp,
            "message": {
                "text": message
            },
            "chatbase_fields": {
                "intent": intent,
                "version": CHATBASE_VERSION,
                "not_handled": !isHandled,
                "feedback": IS_FEEDBACK_MESSAGE
            }
        }

        dataArr.push(data);
    });

    const postData = {
        "messages": dataArr
    };

    sendToChatbase(config.chatbase.CHATBASE_FACEBOOK_MESSAGE_BATCH, postData);
}

function sendMessageFeedback(senderId, message, intent, timeStamp) {
    const data = {
        "api_key": config.chatbase.API_KEY,
        "type": "user",
        "user_id": senderId,
        "time_stamp": timeStamp.valueOf(),
        "platform": config.chatbase.FLATFORM,
        "message": message,
        "intent": intent,
        "feedback": true,
        "version": CHATBASE_VERSION
    };

    sendToChatbase(config.chatbase.CHATBASE_GENERIC_MESSAGE, data);
}

/**
 * SenD the message to chatbase.
 * @param uri - request URL- api.
 * @param data - request body data which send to chatbase.
 */
function sendToChatbase(uri, data) {
    request({
        uri: uri,
        method: 'POST',
        json: data

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('Send to chatbase success');
        } else {
            console.error("chatbase : " + response);
        }

    });
}
