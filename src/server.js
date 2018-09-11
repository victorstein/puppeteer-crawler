let Puppeteer =  require('puppeteer');
let  { Firebase } = require('../firebase/Config');

//RUN PUPPETEER HEADLESSLY?
const headless = true;
let page;
let browser;

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

    browser.close()

  } catch(e){
    console.log(e)
  }
}

const getCompanyData = async (companyIDs)=> {
  try{

    let companiesData = [];
    console.log('Retreiving Company Info');

    for(let id of companyIDs){

      await page.goto('https://www.macraesbluebook.com/search/company.cfm?company=' + id, { waitUntil: 'load' });
      let data = await page.evaluate(() => {

        let name = document.querySelector('h1[itemprop="name"]').innerText;
        let address = document.querySelector('div[itemprop="address"] > span:nth-child(2)').innerText.replace(/(\r\n\t|\n|\r\t)/gm,"");
        let phone = document.querySelector('span[itemprop="telephone"]').innerText;
        let website = document.querySelector('a[itemprop="url"]').href;

        return { name, address, phone, website }
      });

      companiesData.push(data);

    }

    console.log('Done retreiving all company data')
    return companiesData

  } catch(e){
    console.log(e)
  }
}

const getAllCompanyIDs = async (productCodes)=> {
  try{

    let companyIDs = [];

    console.log('Retreiving all company IDs...')
    for(let code of productCodes){

      await page.goto('https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=' + code, { waitUntil: 'load' });
      let data = await page.evaluate(() => {
        let result = Array.from(document.querySelectorAll('#divListing > .firstLine > .divLeft > a'));
        return result.map(u => u.href.split('?company=')[1])
      });

      companyIDs.push(...data);

    }

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

    let prodIDs = [];

    console.log('Retreiving all prod codes...')
    for(let id of headingIDs){

      await page.goto('https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=' + id, { waitUntil: 'load' });
      let data = await page.evaluate(() => {
        let result = Array.from(document.querySelectorAll('.alinks3'));
        return result.map(u => u.href.split('?prod_code=')[1])
      });

      prodIDs.push(...data);

    }

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

    return data

  } catch(e){
    console.log(e)
  }
}
