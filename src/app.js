'use strict';
global.rootPath = __dirname;
require('dotenv').config();

const express = require('express');
const app = express();
const REST_PORT = (process.env.PORT || 5000);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var logger = require(global.rootPath + '/controller/logger');
var constant = require(global.rootPath + "/config/constants");
var campaign = require(global.rootPath + "/controller/campaign");
const fbGraphApi = require(global.rootPath + "/controller/fbGraphApi");
const controller = require(global.rootPath + "/controller/emailController");
var dbController = require(global.rootPath + "/controller/databaseController");
const cache = require(global.rootPath + "/controller/cache");
var utils = require(global.rootPath + '/controller/utils/utils');
var webhookAction = require(global.rootPath + "/webhook/webhookAction.js");
var facebookBot = require(global.rootPath + "/webhook/facebookBot.js");

// Connect to MongoDB
var config = require(global.rootPath + '/config/environment/database_info');
var mongoose = require('mongoose');
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function (err) {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1); // eslint-disable-line no-process-exit
});

// Account Kit
const fs = require('fs');
const Guid = require('guid');
const Mustache  = require('mustache');
const Querystring  = require('querystring');

app.use(express.static(global.rootPath + '/public'));
var csrf_guid = Guid.raw();
const api_version = "v1.1";
const app_id = "396623434011899";
const app_secret = '7ce902aa909cbd9f8f7f3e9466942280'
const me_endpoint_base_url = 'https://graph.accountkit.com/v1.1/me';
const token_exchange_base_url = 'https://graph.accountkit.com/v1.1/access_token';

function loadLogin() {
  return fs.readFileSync(global.rootPath + '/public/login.html').toString();
}

function loadLoginSuccess() {
  return fs.readFileSync(global.rootPath + '/public/login_success.html').toString();
}

function loadRequestUserPermission() {
  return fs.readFileSync(global.rootPath + '/public/request_permission.html').toString();
}

app.get('/', function(req, res){

  var senderId = req.query.senderId;
  var product = req.query.product;
  var view = {
    appId: app_id,
    csrf: csrf_guid,
    version: api_version,
    name: "",
    phone: "",
    address: "",
    product: product
  };

  console.log("Sender Id: " + senderId);
  var query = {
      "collection_name": "User",
      "condition": {
          fb_id : senderId
      }
  }

  dbController.find(query).then(function(result){
    logger.debug("Result: " + JSON.stringify(result));
    view.phone = result[0].phone;
    view.name = result[0].name;
    view.address = result[0].address;
    var html = Mustache.to_html(loadLogin(), view);
    res.send(html);
  }).catch(function(err){

  });
});

app.post('/sendcode', function(req, res){
   const data = req.body;

  // CSRF check
  console.log("CSRF after: " + data.csrf_nonce);
  if (req.body.csrf_nonce === csrf_guid) {
    var app_access_token = ['AA', app_id, app_secret].join('|');
    var params = {
      grant_type: 'authorization_code',
      code: data.code,
      access_token: app_access_token
      //appsecret_proof: app_secret
    };

    // exchange tokens
    var token_exchange_url = token_exchange_base_url + '?' + Querystring.stringify(params);
    request.get({url: token_exchange_url, json: true}, function(err, resp, respBody) {
      console.log(respBody);
      var view = {
        user_access_token: respBody.access_token,
        expires_at: respBody.expires_at,
        user_id: respBody.id
      };
      // get account details at /me endpoint
      var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
      request.get({url: me_endpoint_url, json:true }, function(err, resp, respBody) {
        // send login_success.html
        console.log(respBody);
        if (respBody.phone) {
          view.method = "SMS"
          view.identity = respBody.phone.number;
        } else if (respBody.email) {
          view.method = "Email"
          view.identity = respBody.email.address;
        }

        var html = Mustache.to_html(loadLoginSuccess(), view);
        res.send(html);;
      });
    });
  }
  else {
    // login failed
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("Something went wrong. :( ");
  }

});

// End Account Kit

app.get('/webhook/', (req, res) => {
    facebookBot.facebookGet(req, res);
});

app.post('/webhook/', (req, res) => {
    facebookBot.facebookPost(req, res);
});

app.get('/requestUserPermissions', (req, res) => {
    var view = {
      appId: app_id
    };

    var html = Mustache.to_html(loadRequestUserPermission(), view);
    res.send(html);
});

app.post('/externalApi/', (req, res) => {
    logger.debug("Call external api");
    webhookAction.webhook(req, res, facebookBot);
});

app.get('/getGraphConversations/', (req, res) => {
    var messageId = req.query.messageId;
    console.log("Message Id: " + messageId);
    fbGraphApi.getGraphConversations(messageId)
        .then(function (result) {
            res.send(result);
        })
        .catch(function (err) {
            res.send(err)
        });
});

app.get('/redirect', (req, res) => {

    var userId = decodeURIComponent(req.query.userId);
    var senderId = decodeURIComponent(req.query.agentId);
    campaign.agentAccept(facebookBot, senderId, userId, function(){

    });

    var inboxUrl = decodeURIComponent(req.query.inboxUrl);
    console.log("INBOX_URL: " + inboxUrl);
    res.writeHead(307,
        { Location: inboxUrl }
    );
    res.end();
});

app.get('/sendFBMessage', (req, res) => {
    console.log("Start");
    var senderId = req.query.senderId;
    console.log("Sender id: " + senderId)
    facebookBot.sendFBMessage(senderId, { text: "You are logined now " + senderId});
    res.status(200).json({"status":"OK"});
});

const JSONbig = require('json-bigint');
app.post('/insertUser/', (req, res) => {
    var body = JSONbig.parse(req.body);
    dbController.insert("User", body.data, function (result) {
        res.send(result);
    });
});

app.post('/insertGroup/', (req, res) => {
    var body = JSONbig.parse(req.body);
    dbController.insert("Group", body.data, function (result) {
        res.send(result);
    });
});

app.post('/insertOrder/', (req, res) => {
    // var order = JSON.parse(req.body);
    var order = req.body
    logger.debug("Order Info: " + JSON.stringify(order));
    dbController.insertOrder(order).then(function(){
      facebookBot.sendFBMessage(order.senderId, { text: "GomHang.vn đã nhận được đơn hàng của bạn! \nTư vấn viên sẽ liên hệ lại với bạn trong thời gian sớm nhất!"});
      res.send({status: true});
    }).catch(function(err){
      facebookBot.sendFBMessage(order.senderId, { text: "Hmmm, đơn hàng không thành công. \nBạn vui lòng kiểm tra lại thông tin và đặt hàng lại nhé!"});
      res.send({status: false});
    });
});

app.listen(REST_PORT, () => {
    console.log('Rest service ready on port ' + REST_PORT);
});
