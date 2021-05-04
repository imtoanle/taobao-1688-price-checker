const csv = require('csv-parser');
const fs = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('market');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS lcds (model VARCHAR(255), branch VARCHAR(255), size DECIMAL(3,2), type VARCHAR(255), resolution VARCHAR(255), brightness VARCHAR(255), interface VARCHAR(255))");

  // var stmt = db.prepare();

  // fs.createReadStream('lcd.csv')
  // .pipe(csv())
  // .on('data', (row) => {
  //   var [w, h] = row['Resolution'].split('x').sort(function(a, b){ return b-a; })
  //   db.run(
  //     "INSERT INTO lcds VALUES (?, ?, ?, ?, ?, ?, ?)",
  //     row['LCD Model'],
  //     row['Brand'],
  //     row['Size'],
  //     row['Type'],
  //     `${w}x${h}`,
  //     row['Brightness'],
  //     row['Interface']
  //   );
  // })
  // .on('end', () => {
  //   console.log('CSV file successfully processed');
  // });

  // stmt.finalize();

  db.each("SELECT rowid AS id, size FROM lcds", function(err, row) {
      console.log(row.id + ": " + row.size);
  });
});

// db.close();



