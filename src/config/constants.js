const CHATBASE_API_KEY = '52a136fd-1788-4da5-b1f4-36f86c6c879a';
const CHATBASE_API_URL = 'https://chatbase.com/api/';
const CHATBASE_FACEBOOK_API_URL = 'https://chatbase.com/api/facebook/';

const FIELD_MESSAGE_ID = "messageId";
const FIELD_NAME = "name";

const PHONE_TYPE = "phone";

module.exports = Object.freeze({
    field: {
      FIELD_MESSAGE_ID : FIELD_MESSAGE_ID,
      FIELD_NAME : FIELD_NAME
    },
    facebook: {
      FB_MESSAGE_URL : "https://graph.facebook.com/v2.9/me/messages",
      FB_SUBSCRIBED_URL : "https://graph.facebook.com/v2.9/me/subscribed_apps?access_token=",
      FB_THREAD_URL : "https://graph.facebook.com/v2.9/me/thread_settings?access_token=",
      FB_PROFILE_URL : "https://graph.facebook.com/v2.9/me/messenger_profile?access_token=",
    },
    validator: {
      PHONE_TYPE : PHONE_TYPE
    }
});
