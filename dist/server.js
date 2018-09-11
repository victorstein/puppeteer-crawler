'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Puppeteer = require('puppeteer');

var _require = require('../firebase/Config'),
    Firebase = _require.Firebase;

//RUN PUPPETEER HEADLESSLY?


var headless = true;
var page = void 0;
var browser = void 0;

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

        //CRAWL ALL PRODUCT CODES USING HEADING IDs
        var productCodes = await getAllProductCodes([headingIDs[0]]);
        console.log('Saving product codes to database...');
        await Firebase.database().ref('/prodCodes/').set(productCodes);
        console.log('Saved!');

        //CRAWL ALL COMPANY IDs USING PRODUCT CODES
        var companyIDs = await getAllCompanyIDs([productCodes[0]]);
        console.log('Saving company IDs to database...');
        await Firebase.database().ref('/companyIDs/').set(companyIDs);
        console.log('Saved!');

        //CRAWL COMPANY DATA
        var companyData = await getCompanyData([companyIDs[0]]);
        console.log('Saving companies data to database...');
        await Firebase.database().ref('/database/').set(companyData);
        console.log('Saved!');

        browser.close();
    } catch (e) {
        console.log(e);
    }
};

var getCompanyData = async function getCompanyData(companyIDs) {
    try {

        var companiesData = [];
        console.log('Retreiving Company Info');

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = companyIDs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var id = _step.value;


                await page.goto('https://www.macraesbluebook.com/search/company.cfm?company=' + id, { waitUntil: 'load' });
                var data = await page.evaluate(function () {

                    var name = document.querySelector('h1[itemprop="name"]').innerText;
                    var address = document.querySelector('div[itemprop="address"] > span:nth-child(2)').innerText.replace(/(\r\n\t|\n|\r\t)/gm, "");
                    var phone = document.querySelector('span[itemprop="telephone"]').innerText;
                    var website = document.querySelector('a[itemprop="url"]').href;

                    return { name: name, address: address, phone: phone, website: website };
                });

                companiesData.push(data);
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

        console.log('Done retreiving all company data');
        return companiesData;
    } catch (e) {
        console.log(e);
    }
};

var getAllCompanyIDs = async function getAllCompanyIDs(productCodes) {
    try {

        var companyIDs = [];

        console.log('Retreiving all company IDs...');
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = productCodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _companyIDs;

                var code = _step2.value;


                await page.goto('https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=' + code, { waitUntil: 'load' });
                var data = await page.evaluate(function () {
                    var result = Array.from(document.querySelectorAll('#divListing > .firstLine > .divLeft > a'));
                    return result.map(function (u) {
                        return u.href.split('?company=')[1];
                    });
                });

                (_companyIDs = companyIDs).push.apply(_companyIDs, _toConsumableArray(data));
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

        var prodIDs = [];

        console.log('Retreiving all prod codes...');
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = headingIDs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _prodIDs;

                var id = _step3.value;


                await page.goto('https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=' + id, { waitUntil: 'load' });
                var data = await page.evaluate(function () {
                    var result = Array.from(document.querySelectorAll('.alinks3'));
                    return result.map(function (u) {
                        return u.href.split('?prod_code=')[1];
                    });
                });

                (_prodIDs = prodIDs).push.apply(_prodIDs, _toConsumableArray(data));
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

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

        return data;
    } catch (e) {
        console.log(e);
    }
};
