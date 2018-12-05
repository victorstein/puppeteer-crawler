'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('../firebase/Config'),
    Firebase = _require.Firebase;

var _require2 = require('../functions/Functions'),
    Queue = _require2.Queue,
    Intro = _require2.Intro;

var _require3 = require('../crawler'),
    data = _require3.data;

var _require4 = require('../catData'),
    catData = _require4.catData;

var Puppeteer = require('puppeteer');
var fs = require('fs');

console.clear();

Intro();

var headless = true;
var browser = void 0;
var page = void 0;
var map = {};
var industry = void 0;
var companiesIDsData = [];

initBrowser(async function () {
  await new Promise(function (res, rej) {
    return setTimeout(function () {
      return res();
    }, 2000);
  });
  console.clear();
  Crawler();
});

async function initBrowser(callback) {
  //INITIATE THE BROWSER
  browser = await Puppeteer.launch({ headless: headless });
  page = await browser.newPage();
  callback();
}

var Crawler = async function Crawler(url) {
  try {
    /*
        console.log('started...')
        let data = await Firebase.database().ref('/').once("value")
        data = data.val()
        data = Object.entries(data.databasemap).reduce((x, u) => {
        	x[u[0]] = Object.keys(u[1]);
        	return x
        }, {});
    
        fs.writeFile('./crawler.json', JSON.stringify(data) , (err)=>{
          if(err) throw err;
          console.log('done')
        });
    
        //CRAWL ALL THE HEADING IDS AND SAVE TO DATABASE
        let headingIDs = await getAllHeadingIDs();
        //headingIDs = headingIDs.slice(1);
        let map = Object.entries(headingIDs).reduce((x, u)=>{
          x[u[1].industry.replace(/(\t|\s|^\s+)/g,"")] = []
          return x
        }, {})
        //console.log('Saving heading IDs to database...')
        //await Firebase.database().ref('/headingIDs/').set(headingIDs);
    
        for(let id of headingIDs){
          //CRAWL ALL PRODUCT CODES USING HEADING IDs
          industry = id.industry;
          var productCodes = await getAllProductCodes([id.url], id.industry);
          //console.log('Saving product codes to database...')
          //await Firebase.database().ref('/prodCodes/' + id).set(productCodes);
          //console.log('Saved!')
    
          for(let id of productCodes.data){
            //CRAWL ALL COMPANY IDs USING PRODUCT CODES
            let companyIDs = await getAllCompanyIDs([id]);
            companiesIDsData = [];
            let progress = map[industry];
            let newData = companyIDs.reduce((x, u) => {
              x[u] = { crawled: true };
              return x
            }, {});
            let total = Object.assign({}, progress, newData);
    
            map[industry] = total;
            let difference = Object.keys(total).length - Object.keys(progress).length;
            Queue.progress();
            console.log(`Crawled ${Object.keys(newData).length} company IDs... `)
            await new Promise((res, rej)=>setTimeout(()=>res(), 2000));
            console.log(`Deleting duplicates from existing records...`)
            await new Promise((res, rej)=>setTimeout(()=>res(), 1000));
            console.log(`Saving ${difference} new company IDs to database... `)
            await new Promise((res, rej)=>setTimeout(()=>res(), 2000));
            await Firebase.database().ref('/databasemap/'+industry).set(map[industry]);
            //await Firebase.database().ref('/companyIDs/' + id).set(companyIDs);
            //console.log('Saved!')
            */
    //CRAWL COMPANY DATA
    //catData = Object.entries(catData);
    catData = Object.entries(catData).reduce(function (x, u, i) {
      if (i > 60) {
        x[u[0]] = u[1];
        return x;
      }
      return x;
    }, {});

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(catData)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2),
            _industry = _step$value[0],
            _data = _step$value[1];

        var companyData = await getCompanyData(_data, _industry);
        console.log('Adding Information to Database');
        await Firebase.database().ref('/database/' + _industry).set(companyData);
      }

      //let companyData = await getCompanyData(company[1], company[0]);
      //console.log('Adding Information to Database')
      //await Firebase.database().ref('/database/'+ id).set(companyData);
      //}

      //}
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};

var getCompanyData = async function getCompanyData(companyIDs, industry) {
  try {
    var companiesData = await Queue.start(companyIDs, 1, 'https://www.macraesbluebook.com/search/company.cfm?company=', "finalData", industry);

    return companiesData;
  } catch (e) {}
};

var getAllCompanyIDs = async function getAllCompanyIDs(productCodes) {
  try {

    var codes = productCodes[0].includes("-") ? productCodes[0].split("-")[0] : productCodes[0];
    var _page = productCodes[0].includes("-") ? productCodes[0].split("-")[1] : 0;
    _page++;

    var companyIDs = await Queue.start([productCodes[0]], 1, 'https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=', "companyIDs", "", _page);
    companiesIDsData.push(companyIDs[0].result);
    if (companyIDs[0].next) {
      var _companyIDs$0$result;

      var append = "-" + _page;
      var _data2 = await getAllCompanyIDs([codes + append]);
      (_companyIDs$0$result = companyIDs[0].result).push.apply(_companyIDs$0$result, _toConsumableArray(_data2));
    }
    //console.log(companiesIDsData)
    var final = companiesIDsData.reduce(function (x, u) {
      return x.concat(u);
    }, []);
    final = new Set([].concat(_toConsumableArray(final)));
    final = [].concat(_toConsumableArray(final));

    return final;
  } catch (e) {
    console.log(e);
  }
};

var getAllProductCodes = async function getAllProductCodes(headingIDs, industry) {
  try {

    var prodIDs = await Queue.start(headingIDs, 1, 'https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=', "prodCodes");

    prodIDs = new Set([].concat(_toConsumableArray(prodIDs)));
    prodIDs = [].concat(_toConsumableArray(prodIDs));
    prodIDs = { data: prodIDs, industry: industry };

    return prodIDs;
  } catch (e) {}
};

var getAllHeadingIDs = async function getAllHeadingIDs() {
  try {

    var _data3 = await Queue.start([""], 1, 'https://www.macraesbluebook.com/', "headingIDs");

    return _data3;
  } catch (e) {
    console.log(e);
  }
};
