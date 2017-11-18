var mongoose = require('mongoose');
var User = require(global.rootPath + '/model/user.model');
var Group = require(global.rootPath + '/model/group.model');
var ORDER = require(global.rootPath + '/model/order.model');

var logger = require(global.rootPath + '/controller/logger');
var moment = require('moment');

exports.insertOrder = function(orderInfo){
  return new Promise((resolve, reject) => {
    var query = {
        "collection_name": "User",
        "condition": {
            fb_id : orderInfo.senderId
        },
        'data': {
          name: orderInfo.name,
          phone: orderInfo.phone,
          address: orderInfo.address
        }
    }

    findOneAndUpdate(query).then(function(result){
      logger.debug("Result update user: " + JSON.stringify(result));
      if (result._id) {
          var userId = result._id;
          var order = createOrderData(userId, orderInfo.product);
          logger.debug("Order: " + order);
          var query = {
              "collection_name": "Order",
              "data": order
          }
          insert(query).then(function(){
              resolve();
          }).catch(function (err){
              reject(err);
          });
      }
    });
  });
}

createOrderData = function(userId, product){
  var today = moment().format("DD/MM/YYYY");
  var time = moment().format("HH:mm");
  // logger.debug("User_Id: " + today);
  return {
    "_user": userId,
    "product": product,
    "create_date": today,
    "create_time": time
  }
}

insert = function(json){
  return new Promise((resolve, reject) => {
    var schema = mongoose.model(json.collection_name).schema;
    var model = new (mongoose.model(json.collection_name, schema));
    for(fieldName in json.data){
      model[fieldName] = json.data[fieldName];
    }
    model.save(function(err) {
      if (err) reject(err);
      resolve();
    });
  });
}

var findOneAndUpdate = function(json){
  return new Promise((resolve, reject) => {
    var model = mongoose.model(json.collection_name);
    model.findOneAndUpdate(json.condition , { $set:json.data }, {upsert:true} ,function(err, docs) {
      if (err) reject(err);
      resolve(docs);
    });
  });
}

update = function(json){
  return new Promise((resolve, reject) => {
    var model = mongoose.model(json.collection_name);
    model.update(json.condition , { $set:json.data } ,function(err) {
      if (err) reject(err);
      resolve();
    });
  });
}

find = function(json){
  return new Promise((resolve, reject) => {
    var model = mongoose.model(json.collection_name);
    model.find(json.condition).lean().exec(function (err, result) {
      if(err) reject(err);
      resolve(result);
    });
  });
}

remove = function(json){
  return new Promise((resolve, reject) => {
    var model = mongoose.model(json.collection_name);
    model.remove(json.condition, function(err){
      if(err) reject(err);
      resolve();
    });
  });
}

module.exports.insert = insert;
module.exports.findOneAndUpdate = findOneAndUpdate;
module.exports.update = update;
module.exports.find = find;
module.exports.remove = remove;
