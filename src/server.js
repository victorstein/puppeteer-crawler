let { Firebase } = require('../firebase/Config');
let { Queue } = require('../functions/Functions');
let Puppeteer =  require('puppeteer');

const headless = false;
let browser;
let page;

initBrowser(()=>{
  Crawler();
});

async function initBrowser(callback){
  //INITIATE THE BROWSER
  browser = await Puppeteer.launch({ headless });
  page = await browser.newPage();
  callback()
}

const Crawler = async (url) => {
  try{

    //CRAWL ALL THE HEADING IDS AND SAVE TO DATABASE
    let headingIDs = await getAllHeadingIDs();
    console.log('Saving heading IDs to database...')
    await Firebase.database().ref('/headingIDs/').set(headingIDs);
    console.log('Saved!')

    //CRAWL ALL PRODUCT CODES USING HEADING IDs
    let productCodes = await getAllProductCodes([headingIDs[0]]);
    console.log('Saving product codes to database...')
    await Firebase.database().ref('/prodCodes/').set(productCodes);
    console.log('Saved!')

    //CRAWL ALL COMPANY IDs USING PRODUCT CODES
    let companyIDs = await getAllCompanyIDs([productCodes[0]])
    console.log('Saving company IDs to database...')
    await Firebase.database().ref('/companyIDs/').set(companyIDs);
    console.log('Saved!')

    //CRAWL COMPANY DATA
    let companyData = await getCompanyData([companyIDs[0]]);
    console.log('Saving companies data to database...')
    await Firebase.database().ref('/database/').set(companyData);
    console.log('Saved!')

  } catch(e){
    console.log(e)
  }
}

const getCompanyData = async (companyIDs)=> {
  try{

    console.log('Retreiving companies data...')
    let companiesData = await Queue.start( companyIDs, 3, 'https://www.macraesbluebook.com/search/company.cfm?company=', "finalData");

    console.log('Done retreiving all company data')
    return companiesData

  } catch(e){
    console.log(e)
  }
}

const getAllCompanyIDs = async (productCodes)=> {
  try{

    console.log('Retreiving all company IDs...')
    let companyIDs = await Queue.start( productCodes, 3, 'https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=', "companyIDs");

    console.log('Done retreiving all company IDs')

    console.log('Cleaning duplicate entries if any')
    companyIDs = new Set([ ...companyIDs ]);
    companyIDs = [...companyIDs]

    return companyIDs

  } catch(e){
    console.log(e)
  }
}

const getAllProductCodes = async (headingIDs)=> {
  try{

    console.log('Retreiving all Product Codes...')
    let prodIDs = await Queue.start( headingIDs, 3, 'https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=', "prodCodes");
    console.log('Done retreiving all prod codes')

    console.log('Cleaning duplicate entries if any')
    prodIDs = new Set([ ...prodIDs ]);
    prodIDs = [...prodIDs]

    return prodIDs

  } catch(e){
    console.log(e)
  }
}

const getAllHeadingIDs = async () =>{
  try{

    console.log('Retreiving all heading IDs')
    await page.goto('https://www.macraesbluebook.com/', { waitUntil: 'load' });
    let data = await page.evaluate(() => {
      let result = Array.from(document.querySelectorAll('.td_tab_index > a'));
      return result.map(u => u.href.split('?groupid=')[1])
    });
    console.log('Done retreiving all heading IDs')

    console.log('Cleaning duplicate entries if any')
    //CLEAN DUPLICATES IF ANY
    data = new Set([ ...data ]);
    data = [...data]
    await browser.close()

    return data

  } catch(e){
    console.log(e)
  }
}
