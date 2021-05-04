const puppeteer = require('puppeteer')
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('market');

function extractAttributes(attrs){
  // BOE 10.1" IPS LCM 1280×800 330nits WLED MIPI 39pins
  let size = String(attrs.match(/\d+\.*\d*(\"|\s*inch)/g) || '')
  let res = String(attrs.match(/\d{3,4}\×\d{3,4}/g) || '')
  let brightness = String(attrs.match(/\d*\s*nit/g) || '')
  let pin = String(attrs.match(/\d*\s*pin/g) || '')

  return {
    size: String(size.match(/\d+\.*\d*/g) || ''),
    resolution: res,
    brightness: brightness.replace(/\D/g, ""),
    pins: pin.replace(/\D/g, ""),
    type: 'LCD'
  }
}

async function downloadLcd(page) {
  let products = await page.$$('.product_list dl')

  for(let product of products) {
    if (!(await product.$('dd.attr a')) || !(await product.$('dd.model a:last-child'))) { continue; }

    let attrs = await product.$eval('dd.attr a', div => div.innerText);
    let model = await product.$eval('dd.model a:last-child', div => div.innerText);

    // var attrs, model
    // try {

    // } catch (e) {
    //   console.log(`Loi model: ${model}`)
    //   throw(e)
    // }
    
    
    let attributes = extractAttributes(attrs)

    db.serialize(function() {
      db.run(
        "INSERT INTO lcds VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          model,
          '',
          attributes['size'],
          'LCD',
          attributes['resolution'],
          attributes['brightness'],
          'MIPI',
          0,
          0,
          attributes['pins']
        ],
        function(err, row) {
          if (err) {
            if (err.code == 'SQLITE_CONSTRAINT') {
              console.log(`Duplicated ${model}`)
            } else console.log(err)
          } else {
            console.log(`Inserted: ${model} - ID: ${this.lastID}`);
          }
        }
      );
    });
    // console.log([
    //   model,
    //   '',
    //   attributes['size'],
    //   'LCD',
    //   attributes['resolution'],
    //   attributes['brightness'],
    //   'MIPI',
    //   0,
    //   0,
    //   attributes['pins']
    // ])
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36')

  await page.goto('https://www.panelook.com/product_cat.php?catid=38&pl=photo&st=&signal_type_category=140&page=25')
  let pagination = await page.$$('.list_op .next')

  await downloadLcd(page)

  while (pagination.length == 2) {
    await page.click('.list_op .next')
    await page.waitForSelector('.product_list');
    await page.waitForSelector('.list_op .next');
    await downloadLcd(page)
    await sleep(5000)
  }

  await browser.close()
})()
