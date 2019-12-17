const mongoose = require('mongoose');
var findorcreate = require('mongoose-findorcreate');
const config = require('./bin/config.json');


module.exports = function (mongoose) {
  var User = new mongoose.Schema({
    user_id: { type: String, index: true, unique: true },
    display_name: String,
    username: String,
    photo: String,
    profile: Object,
    access_token: String,
    refresh_token: String,
    services: []
  });
  User.plugin(findorcreate);

  var Dig = new mongoose.Schema({
    user_id: { type: String, index: true, unique: true },
    dig_id: String,
    dug_id: String

  });
  Dig.plugin(findorcreate);

  var models = {
    User: mongoose.model('User', User),
    Dig: mongoose.model('Dig', Dig)
  }

  return models;
}
