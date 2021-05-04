const fs = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('market');

db.serialize(function() {
  // db.run("CREATE TABLE IF NOT EXISTS lcds (model VARCHAR(255), branch VARCHAR(255), size DECIMAL(3,2), type VARCHAR(255), resolution VARCHAR(255), brightness VARCHAR(255), interface VARCHAR(255), checked_1688 BOOLEAN DEFAULT 0, checked_taobao BOOLEAN DEFAULT 0, pins SMALLINT)");
  // db.run("DROP TABLE lcd_links");
  // db.run("CREATE TABLE IF NOT EXISTS lcd_links (model VARCHAR(255), price DECIMAL(10,5), link VARCHAR(255) UNIQUE, market VARCHAR(255))");
  // db.run("ALTER TABLE lcds ADD checked_taobao BOOLEAN DEFAULT 0");
  // db.run("ALTER TABLE lcds RENAME COLUMN checked TO checked_1688");
  // db.run("ALTER TABLE lcds RENAME COLUMN checked_tabao TO checked_taobao");
  // db.run("UPDATE lcds SET checked = 0");
  // db.run("ALTER TABLE lcds ADD pins SMALLINT");
  db.run("CREATE UNIQUE INDEX lcds_model_unique ON lcds(model)");
  

  
});


db.close();

