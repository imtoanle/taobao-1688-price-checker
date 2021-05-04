const fs = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('market');

db.serialize(function() {
  db.serialize(function() {
    // db.each("SELECT rowid AS id, model, checked_1688, checked_taobao FROM lcds WHERE model = ?", ["CLAA080WQ05"], function(err, row) {
    //   console.log(row)
    // });
    // db.each("SELECT COUNT(rowid) FROM lcds WHERE checked_taobao = ? AND checked_1688 = ?", [0, 0], function(err, row) {
    //   console.log(row)
    // });

    db.each("SELECT rowid AS id, model, checked_1688, checked_taobao FROM lcds", [], function(err, row) {
      console.log(row)
    });
  });
});

db.close();

