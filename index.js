const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('market');

var data = [];

function getRecords(){
  return new Promise((resolve,reject)=>{
  // db.all('SELECT model FROM lcds WHERE checked = ? AND model = ?', [0, "LH154Q01-TD01"], (err,rows)=>{
  db.all('SELECT model FROM lcds WHERE checked_1688 = ? OR checked_taobao = ?', [0, 0], (err,rows)=>{
      if(err){
          return console.error(err.message);
      }
      rows.forEach((row)=>{
          data.push(row);
      });
      
     resolve(data);
    })
  })
}

async function insertLcdLink(model, price, link, market){
  db.serialize(function() {
    db.run(
      "INSERT INTO lcd_links VALUES (?, ?, ?, ?)",
      [
        model,
        price,
        link,
        market
      ],
      function(err, row){
        if (err) {
          if (err.code == 'SQLITE_CONSTRAINT') {
            db.run("UPDATE lcds SET checked_" + market + " = ? WHERE model = ?", [ 1, model ]);
            console.log("Model nay dup")
          } else console.log(err)
        } else {
          console.log("Inserted: " + this.lastID);
        }
      }
    );
  });
}

async function modelDownloaded(model, market){
  return new Promise((resolve,reject)=>{
  db.get("SELECT rowid FROM lcd_links WHERE model = ? AND market = ?", [model, market], (err,row)=>{
      let exists = false;
      if (row) exists = true;
      resolve(exists);
    })
  })
}
async function findIn1688(page, lcd_model){
  let counter = 0
  let exists = await modelDownloaded(lcd_model, '1688');
  console.log(exists)
  if (exists) {
    updateChecked(lcd_model, '1688')
    return
  }

  let productKey = lcd_model.split(" ")[0]
  
  await page.goto(`https://m.1688.com/offer_search/-6D7033.html?keywords=${productKey}`)
  if (!page.$('#list-main .list_group-item')) return;
  // await page.waitForSelector('div[data-spm="offerlist"] #sm-offer-list');
  let products = await page.$$('#list-main .list_group-item')

  for(let product of products) {
    let priceTag = await product.$('.item-info .count_price')
    if (!priceTag) continue;

    let title = await product.$eval('.item-info .item-info_title', div => div.innerText);

    if (title.includes(productKey.split("-")[0])) {
      let price = await product.$eval('.item-info .count_price', function(div){
        if (div.innerText.match(/\d+\.*\d*/g))
          return div.innerText.match(/\d+\.*\d*/g).join('')
        else
          return 0
      });
      let link = await product.$eval('a.item-link', a => a.href);
      
      console.log(`Insert Model: ${lcd_model} - Link: ${link}`)
      await insertLcdLink(lcd_model, price, link, '1688')
      counter += 1
    }
  }

  console.log('Model: ' + lcd_model + ' - Counter: ' + counter)
  if (!(counter > 0)) {
    console.log('Di vo update')
    updateChecked(lcd_model, '1688')
  }
  
  await sleep(5000);
  return counter
}

async function findInTaobao(page, lcd_model){
  let counter = 0
  let exists = await modelDownloaded(lcd_model, 'taobao');
  console.log(exists)
  if (exists) {
    updateChecked(lcd_model, 'taobao')
    return
  }

  let productKey = lcd_model.split(" ")[0]
  await page.goto(`https://s.taobao.com/search?q=${productKey.replace(/\s+/g, "+")}&imgfile=&js=1&stats_click=search_radio_all%3A1&initiative_id=staobaoz_20201229&ie=utf8`)

  // if (await page.$('.sb-search form #mq')) {
  //   await page.waitForSelector('.sb-search form #mq');
  //   await page.click('.sb-search form #mq');
  //   await sleep(1000)
  //   await page.keyboard.type(productKey);
  //   await sleep(1000)
  //   await page.click('.sb-search form input[type="submit"]');
  // } else {
  //   await page.waitForSelector('#J_SearchForm .search-combobox-input');
  //   await page.click('#J_SearchForm .search-combobox-input');
  //   await sleep(2000)
  //   await page.keyboard.type(productKey);
  //   await sleep(2000)
  //   await page.click('#J_SearchForm button[type="submit"]');
  // }

  // await page.waitForNavigation();

  if (await page.$('.captcha-tips .warnning-text')) {
    let blocked = await page.$eval('.captcha-tips .warnning-text', div => div.innerText.includes("Sorry, we have detected unusual traffic from your network"));
    if (blocked) return;
  }

  if (!(await page.$('#J_itemlistCont .item'))) {
    console.log('Di vo update')
    updateChecked(lcd_model, 'taobao')
  }

  let products = await page.$$('#mainsrp-itemlist .items .item[data-category="auctions"]')

  for(let product of products) {
    let priceTag = await product.$('.ctx-box .price strong')
    if (!priceTag) continue;

    let title = await product.$eval('.ctx-box a.J_ClickStat', div => div.innerText);

    if (title.includes(productKey.split("-")[0])) {
      let price = await product.$eval('.ctx-box .price strong', function(div){
        if (div.innerText.match(/\d+\.*\d*/g))
          return div.innerText.match(/\d+\.*\d*/g).join('')
        else
          return 0
      });
      let link = await product.$eval('.ctx-box a.J_ClickStat', a => a.href);
      
      await insertLcdLink(lcd_model, price, link, 'taobao')
      counter += 1
    }
  }

  console.log('Model: ' + lcd_model + ' - Counter: ' + counter)
  if (!(counter > 0)) {
    console.log('Di vo update')
    updateChecked(lcd_model, 'taobao')
  }

  await sleep(10000);
  return counter
}

function loadCookies(path){
  let cookies = fs.readFileSync(path, 'utf8')
  return JSON.parse(cookies)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// function getPrice(value){
//   if (value.match(/\d+\.*\d*/g))
//     value.match(/\d+\.*\d*/g).join('')
//   else
//     0
// }

function updateChecked(model, market){
  db.serialize(function() {
    db.run("UPDATE lcds SET checked_" + market + " = ? WHERE model = ?", [ 1, model ]);
  });
}

// async function loginTaobao(page){
//   page.goto('https://login.taobao.com/member/login.jhtml');

//   await sleep(5000)

//   page.click('#fm-login-id');
//   await sleep(2000)
//   page.keyboard.type('ktoanlba');

//   await sleep(2000)
//   page.click('#fm-login-password');
//   await sleep(2000)
//   page.keyboard.type('5OB%YWitjFz!');
//   await sleep(2000)

//   page.click('.fm-submit');

//   // await page.waitForNavigation();
// }

(async () => {
  puppeteer.use(StealthPlugin())
  const browser = await puppeteer.launch({ headless: false })
  const page1688 = await browser.newPage()
  const pagetaobao = await browser.newPage()

  await page1688.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36')
  await pagetaobao.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36')

  await page1688.setCookie(...loadCookies('cookies_1688.json'))
  await pagetaobao.setCookie(...loadCookies('cookies_taobao.json'))
  await pagetaobao.setExtraHTTPHeaders({ referer: "https://s.taobao.com/search?q=monitor&imgfile=&js=1&stats_click=search_radio_all%3A1&initiative_id=staobaoz_20201226&ie=utf8" })

  // await pagetaobao.goto('https://world.taobao.com/')
  // await loginTaobao(pagetaobao)

  var lcds = await getRecords();

  for(let lcd of lcds) {
    try {
      await findIn1688(page1688, lcd.model)
    } catch (e) {
      console.log("Failed Model: " + lcd.model);
      console.log(e);
      await sleep(30000);
    }

    try {
      await findInTaobao(pagetaobao, lcd.model)
    } catch (e) {
      console.log("Failed Model: " + lcd.model);
      console.log(e);
      await sleep(30000);
    }
  }

  db.serialize(function() {
    db.each("SELECT rowid AS id, model, price, link, market FROM lcd_links", function(err, row) {
      console.log(row.id + ": " + row.model + " - " + row.price + " - " + row.link + " - " + row.market);
    });
  });
  

  // if (products) {
  //   var abc = await products.$$('', divs => console.log(divs))
    
  //   // await products.$$eval('div.common-offer-card .price-container .price', divs => divs.map(n => n.innerText));
  //   // var prices = await products.$$eval('div.common-offer-card .price-container .price', divs => divs.map(n => n.innerText));
  //   // var titles = await products.$$eval('div.common-offer-card .desc-container .title', divs => divs.map(n => n.innerText));
    
  //   // console.log(titles);
  // } else {

  // }
  
  // var hasProduct = await page.evaluate(() => {
  //   let elements = document.querySelector('#sm-offer-list');
  //   return elements;
  // });
  // console.log(hasProduct);
  await browser.close()
})()
