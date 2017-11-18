var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GroupSchema = new mongoose.Schema({
    // id: String,
    users: [{ type: Schema.ObjectId, ref: 'User' }],
    title: String
});

module.exports = mongoose.model('Group', GroupSchema);
