let { Firebase } = require('../firebase/Config');
let { Queue, Intro } = require('../functions/Functions');
let Puppeteer =  require('puppeteer');

console.clear()

Intro()

const headless = true;
let browser;
let page;

initBrowser(async ()=>{
  await new Promise((res, rej)=>setTimeout(()=>res(), 2000));
  console.clear()
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

    //console.log('Saving heading IDs to database...')
    //await Firebase.database().ref('/headingIDs/').set(headingIDs);

    for(let id of headingIDs){
      //CRAWL ALL PRODUCT CODES USING HEADING IDs
      var productCodes = await getAllProductCodes([id.url], id.industry);
      //console.log('Saving product codes to database...')
      //await Firebase.database().ref('/prodCodes/' + id).set(productCodes);
      //console.log('Saved!')

      for(let id of productCodes.data){
        //CRAWL ALL COMPANY IDs USING PRODUCT CODES
        let companyIDs = await getAllCompanyIDs([id])
        //console.log('Saving company IDs to database...')
        //await Firebase.database().ref('/companyIDs/' + id).set(companyIDs);
        //console.log('Saved!')

        //CRAWL COMPANY DATA
        let companyData = await getCompanyData(companyIDs, productCodes.industry);
        console.log('Adding Information to Database')
        await Firebase.database().ref('/database/'+ id).set(companyData);
      }

    }

  } catch(e){
    console.log(e)
  }
}

var companiesIDsData = [];

const getCompanyData = async (companyIDs, industry)=> {
  companiesIDsData = [];
  try{
    let companiesData = await Queue.start( companyIDs, 1, 'https://www.macraesbluebook.com/search/company.cfm?company=', "finalData", industry);

    return companiesData

  } catch(e){
  }
}

const getAllCompanyIDs = async (productCodes)=> {
  try{

    var codes = (productCodes[0].includes("-")) ? productCodes[0].split("-")[0] : productCodes[0];
    let page = (productCodes[0].includes("-")) ? productCodes[0].split("-")[1] : 0;
    page++;

    let companyIDs = await Queue.start( [productCodes[0]], 1, 'https://www.macraesbluebook.com/search/product_company_list.cfm?prod_code=', "companyIDs", "", page);
    companiesIDsData.push(companyIDs[0].result)
    if(companyIDs[0].next){
      let append = "-" + page
      let data = await getAllCompanyIDs([codes+append]);
      companyIDs[0].result.push(...data);
    }

    let final = companiesIDsData.reduce((x, u) => x.concat(u) ,[]);
    final = new Set([ ...final ]);
    final = [...final];

    return final

  } catch(e){
    console.log(e)
  }
}

const getAllProductCodes = async (headingIDs, industry)=> {
  try{

    let prodIDs = await Queue.start( headingIDs, 1, 'https://www.macraesbluebook.com/menu/product_heading.cfm?groupid=', "prodCodes");

    prodIDs = new Set([ ...prodIDs ]);
    prodIDs = [...prodIDs];
    prodIDs = { data: prodIDs, industry }

    return prodIDs

  } catch(e){
  }
}

const getAllHeadingIDs = async () =>{
  try{

    let data = await Queue.start( [""], 1, 'https://www.macraesbluebook.com/', "headingIDs");

    return data

  } catch(e){
    console.log(e)
  }
}
