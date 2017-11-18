
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var OrderSchema = new mongoose.Schema({
  product : String,
  create_date : String,
  create_time : String,
  _user : [{ type: Schema.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model('Order', OrderSchema);
