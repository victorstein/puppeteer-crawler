'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('../firebase/Config'),
    Firebase = _require.Firebase;

var _require2 = require('../functions/Functions'),
    Queue = _require2.Queue,
    Intro = _require2.Intro;

var Puppeteer = require('puppeteer');

console.clear();

Intro();

var headless = true;
var browser = void 0;
var page = void 0;
var map = {};
var industry = void 0;

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

    //CRAWL ALL THE HEADING IDS AND SAVE TO DATABASE
    var headingIDs = await getAllHeadingIDs();
    var _map = Object.entries(headingIDs).reduce(function (x, u) {
      x[u[1].industry.replace(/(\t|\s|^\s+)/g, "")] = [];
      return x;
    }, {});
    //console.log('Saving heading IDs to database...')
    //await Firebase.database().ref('/headingIDs/').set(headingIDs);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = headingIDs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var id = _step.value;

        //CRAWL ALL PRODUCT CODES USING HEADING IDs
        industry = id.industry;
        var productCodes = await getAllProductCodes([id.url], id.industry);
        //console.log('Saving product codes to database...')
        //await Firebase.database().ref('/prodCodes/' + id).set(productCodes);
        //console.log('Saved!')

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = productCodes.data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _id = _step2.value;

            //CRAWL ALL COMPANY IDs USING PRODUCT CODES
            var companyIDs = await getAllCompanyIDs([_id]);
            var progress = _map[industry];
            var newData = companyIDs;

            var total = progress.concat(newData);
            total = new Set([].concat(_toConsumableArray(total)));
            total = [].concat(_toConsumableArray(total));

            _map[industry] = total;
            var difference = total.length - progress.length;
            Queue.progress();
            console.log('Crawled ' + newData.length + ' company IDs... ');
            await new Promise(function (res, rej) {
              return setTimeout(function () {
                return res();
              }, 2000);
            });
            console.log('Deleting duplicates from existing records...');
            await new Promise(function (res, rej) {
              return setTimeout(function () {
                return res();
              }, 1000);
            });
            console.log('Saving ' + difference + ' new company IDs to database... ');
            await new Promise(function (res, rej) {
              return setTimeout(function () {
                return res();
              }, 2000);
            });
            await Firebase.database().ref('/databasemap/').set(_map);
            console.clear();
            console.log('awaiting new records...');
            //await Firebase.database().ref('/companyIDs/' + id).set(companyIDs);
            //console.log('Saved!')
            /*
                    //CRAWL COMPANY DATA
                    //let companyData = await getCompanyData(companyIDs, productCodes.industry);
                    //console.log('Adding Information to Database')
                    //await Firebase.database().ref('/database/'+ id).set(companyData);*/
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
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

var companiesIDsData = [];

var getCompanyData = async function getCompanyData(companyIDs, industry) {
  companiesIDsData = [];
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
      var data = await getAllCompanyIDs([codes + append]);
      (_companyIDs$0$result = companyIDs[0].result).push.apply(_companyIDs$0$result, _toConsumableArray(data));
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

    var data = await Queue.start([""], 1, 'https://www.macraesbluebook.com/', "headingIDs");

    return data;
  } catch (e) {
    console.log(e);
  }
};
