
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new mongoose.Schema({
  fb_id : String,
  name: String,
  fb_name: String,
  email: String,
  birthday : String,
  phone : String,
  address : String,
  product : String,
  contract : String,
  create_date : String,
  create_time : String,
  groups : [{ type: Schema.ObjectId, ref: 'Group'}]
});

module.exports = mongoose.model('User', UserSchema);
