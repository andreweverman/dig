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
      last_run: Date

    });
    Dig.plugin(findorcreate);

    var Dug = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },  
      dug_id: String,
      last_run: Date

    });
    Dug.plugin(findorcreate);

    var Catalog = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },  
      catalog_id: String,
      dw_id: String,
      initial_run: Boolean

    });
    Catalog.plugin(findorcreate);


    // exporting
    models = {
      User: mongoose.model('User', User),
      Dig: mongoose.model('Dig', Dig),
      Dug: mongoose.model('Dug', Dug),
      Catalog: mongoose.model('Catalog',Catalog)
    }
  }



  return models;
}
