const mongoose = require('mongoose');
var findorcreate = require('mongoose-findorcreate');
const config = require('./bin/config.json');


module.exports = function (mongoose) {
  var User = new mongoose.Schema  ({
    user_id: { type: String, index: true, unique: true},
    access_token: String,
    refresh_token: String,
    services: []
  });
  User.plugin(findorcreate);

  var models = {
    User: mongoose.model('User', User)
  }

  return models;
}
