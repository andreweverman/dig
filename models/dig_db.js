var path  = require("path");
const config = require(path.resolve("./config") + '/config.json');
const mongoose = require('mongoose');
var findorcreate = require('mongoose-findorcreate');

var models;


module.exports = function (mongoose) {

  if (!models) {

    var User = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      display_name: String,
      username: String,
      photo: String,
      profile: Object,
      access_token: String,
      refresh_token: String,
      services: [{ type: String }]
    });
    User.plugin(findorcreate);



    var Dig = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      dig_id: String,
      dug_id: String,
      last_run: Date

    });
    Dig.plugin(findorcreate);


    // exporting
    models = {
      User: mongoose.model('User', User),
      Dig: mongoose.model('Dig', Dig)
    }
  }



  return models;
}
