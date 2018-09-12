'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('../firebase/Config'),
    Firebase = _require.Firebase;

var _require2 = require('../functions/Functions'),
    Queue = _require2.Queue;

var Puppeteer = require('puppeteer');

var headless = true;
var browser = void 0;
var page = void 0;

initBrowser(function () {
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
    console.log('Saving heading IDs to database...');
    await Firebase.database().ref('/headingIDs/').set(headingIDs);
    console.log('Saved!');

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = headingIDs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var id = _step.value;

        //CRAWL ALL PRODUCT CODES USING HEADING IDs
        var productCodes = await getAllProductCodes([id]);
        console.log('Saving product codes to database...');
        await Firebase.database().ref('/prodCodes/' + id).set(productCodes);
        console.log('Saved!');

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = productCodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _id = _step2.value;

            //CRAWL ALL COMPANY IDs USING PRODUCT CODES
            var companyIDs = await getAllCompanyIDs([_id]);
            console.log('Saving company IDs to database...');
            await Firebase.database().ref('/companyIDs/' + _id).set(companyIDs);
            console.log('Saved!');

            //CRAWL COMPANY DATA
            var companyData = await getCompanyData(companyIDs);
            console.log('Saving companies data to database...');
            await Firebase.database().ref('/database/' + _id).set(companyData);
            console.log('Saved!');
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

var getCompanyData = async function getCompanyData(companyIDs) {
  try {

    console.log('Retreiving companies data...');
    var companiesData = await Queue.start(companyIDs, 3, 'https://www.macraesbluebook.com/search/company.cfm?company=', "finalData");

    console.log('Done retreiving all company data');
    return companiesData;
  } catch (e) {
    console.log(e);
  }
};

var getAllCompanyIDs = async function getAllCompanyIDs(productCodes) {
  try {

    console.log('Retreiving all company IDs...');
    var companyIDs = await Queue.start(productCodes, 3, 'https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=', "companyIDs");

    console.log('Done retreiving all company IDs');

    console.log('Cleaning duplicate entries if any');
    companyIDs = new Set([].concat(_toConsumableArray(companyIDs)));
    companyIDs = [].concat(_toConsumableArray(companyIDs));

    return companyIDs;
  } catch (e) {
    console.log(e);
  }
};

var getAllProductCodes = async function getAllProductCodes(headingIDs) {
  try {

    console.log('Retreiving all Product Codes...');
    var prodIDs = await Queue.start(headingIDs, 3, 'https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=', "prodCodes");
    console.log('Done retreiving all prod codes');

    console.log('Cleaning duplicate entries if any');
    prodIDs = new Set([].concat(_toConsumableArray(prodIDs)));
    prodIDs = [].concat(_toConsumableArray(prodIDs));

    return prodIDs;
  } catch (e) {
    console.log(e);
  }
};

var getAllHeadingIDs = async function getAllHeadingIDs() {
  try {

    console.log('Retreiving all heading IDs');
    await page.goto('https://www.macraesbluebook.com/', { waitUntil: 'load' });
    var data = await page.evaluate(function () {
      var result = Array.from(document.querySelectorAll('.td_tab_index > a'));
      return result.map(function (u) {
        return u.href.split('?groupid=')[1];
      });
    });
    console.log('Done retreiving all heading IDs');

    console.log('Cleaning duplicate entries if any');
    //CLEAN DUPLICATES IF ANY
    data = new Set([].concat(_toConsumableArray(data)));
    data = [].concat(_toConsumableArray(data));
    await browser.close();

    return data;
  } catch (e) {
    console.log(e);
  }
};
