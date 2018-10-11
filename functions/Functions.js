const Puppeteer =  require('puppeteer');
const EventEmitter = require('events');

//RUN PUPPETEER HEADLESSLY?
const headless = true;
let browser;

const Intro = ()=>{
  console.log(`

 macraesbluebook.com

    _|_|_|  _|_|_|      _|_|    _|          _|  _|        _|_|_|_|  _|_|_|
  _|        _|    _|  _|    _|  _|          _|  _|        _|        _|    _|
  _|        _|_|_|    _|_|_|_|  _|    _|    _|  _|        _|_|_|    _|_|_|
  _|        _|    _|  _|    _|    _|  _|  _|    _|        _|        _|    _|
    _|_|_|  _|    _|  _|    _|      _|  _|      _|_|_|_|  _|_|_|_|  _|    _|

                                                                              by TFM

  `)
}

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const Queue = {

  workers: [],

  concurrency: 1,

  tasks: [],

  originalTask: 0,

  url: "",

  type: "",

  industry: "",

  page: 1,

  isBrowserAvailable: true,

  waiting: false,

  progress: () =>{
    console.clear()

    let originalTaskLength = Queue.originalTask;
    let completedTasksLength = originalTaskLength - Queue.tasks.length;
    let amountOfWorkers = Queue.workers.length;
    let completedSymbol = '=';
    let completedPercentage = Math.floor((completedTasksLength*100)/originalTaskLength);
    let nonCompletedPercentage = 100 - completedPercentage;
    let intro = "";
    let waiting = (Queue.waiting) ? "waitting for human verification..." : ""

    switch(Queue.type){
      case "headingIDs":
        intro = `Retreiving all heading IDs...`
      break;
      case "prodCodes":
        intro = `Retreiving all Product Codes...`
      break;
      case "companyIDs":
        intro = `Retreiving all Company IDs...
      Working in page... ${Queue.page}`
      break;
      case "finalData":
        intro = `Retreiving Companies information for ${Queue.industry} industry...`
      break;
    }
    Intro()
    console.log(`
      ${intro}
      ${completedTasksLength} / ${originalTaskLength} [${completedSymbol.repeat(completedPercentage)}${' '.repeat(nonCompletedPercentage)}] ${completedPercentage}%
      Amount of workers in queue ${amountOfWorkers}
      ${waiting}
    `)
  },

  concurrencyLimit: () =>{
    return (Queue.workers.length < Queue.concurrency) ? true : false
  },

  checkForCaptcha: () =>{
    let captchaMessage = document.querySelector("#divPageBody > div > form > table > tbody > tr:nth-child(2) > td");
    if(captchaMessage){
      captchaMessage = (captchaMessage.innerText.includes("Shown in Picture")) ? true : false
    } else {
      captchaMessage =false
    }
    return captchaMessage
  },

  compute: (task) => {
	  return new Promise(async (res, rej) =>{
        var page = await browser.newPage();
        page.setDefaultNavigationTimeout(20000)
        try{

          await page.goto( Queue.url + task, { waitUntil: 'load' });
          let data;
          if(await page.$("#divPageBody > div > form > table > tbody > tr:nth-child(2) > td") === null){
            switch(Queue.type){
              case "prodCodes":
                data = await page.evaluate(() => {
                  let result = Array.from(document.querySelectorAll('.alinks3'));
                  return result.map(u => u.href.split('?prod_code=')[1])
                });
              break;
              case "headingIDs":
                data = await page.evaluate(() => {
                  let result = Array.from(document.querySelectorAll('.td_tab_index > a'));
                  return result.map(u => ({ url: u.href.split('?groupid=')[1], industry: u.innerText.replace(/(\t|\s|^\s+)/g,"") }) )
                });
              break;
              case "companyIDs":
                data = await page.evaluate(async () => {
                  var result = Array.from(document.querySelectorAll('#divListing > .firstLine > .divLeft > a'));
                  result = result.map(u => u.href.split('?company=')[1]);

                  let next = document.querySelector('.button-right');
                  next = (next) ? true : false;
                  result = { next, result }

                  return result

                });
              break;
              case "finalData":
                data = await page.evaluate(() => {

                  let name = document.querySelector('h1[itemprop="name"]');
                  let address = document.querySelector('div[itemprop="address"] > span:nth-child(2)');
                  let phone = document.querySelector('span[itemprop="telephone"]');
                  let website = document.querySelector('a[itemprop="url"]');

                  name = (name) ? name.innerText : ""
                  address = (address) ? address.innerText.replace(/(\r\n\t|\n|\r\t)/gm,"") : ""
                  phone = (phone) ? phone.innerText : ""
                  website = (website) ? website.href : ""

                  return { name, address, phone, website }
                });
              break;
              default:
              break;
            }
            data.industry = Queue.industry;
            await page.goto('about:blank')
            await page.close();
            Queue.progress();
            res(data)

          } else {

            let error = new Error('browser not available')
            Queue.waiting = true;

            Queue.progress();
            if(Queue.isBrowserAvailable){

              try{
                Queue.isBrowserAvailable = false
                let browser2 = await Puppeteer.launch({
                  headless: false
                });
                let page2 = await browser2.newPage();
                await page2.goto( 'https://www.macraesbluebook.com/search/company.cfm?company=1569941', { waitUntil: 'load' });
                await page2.waitFor('.btn-green');
                await page2.goto('about:blank')
                await page2.close();
                await browser2.disconnect()
                await browser2.close()
                Queue.isBrowserAvailable = true
                Queue.waiting = false;
                Queue.progress();
                throw error
              } catch(e){
                console.log(e)
                throw error
              }

            }

          }
        } catch(e) {
          console.log(e + ' in task ' + task)
          if(e.message.includes("Protocol")){
            Queue.isBrowserAvailable = true
            Queue.waiting = false;
            Queue.progress();
            Queue.workers.shift();
            await page.goto('about:blank')
            await page.close();
            Queue.work(task);
          } else if(e.message === "browser not available") {
            Queue.workers.shift();
            await page.goto('about:blank')
            await page.close();
            Queue.work(task);
          } else {
          //console.log('removed worker')
            Queue.workers.shift();
            await page.goto('about:blank')
            await page.close();
            Queue.work(task);
          }
        }
    })
  },

  work: async (task) => {
    //console.log('asigned to queue: ' + task)
    try{
      Queue.workers.push('working');
      let res = await Queue.compute(task);
      Queue.success(res)
    } catch(e){
      console.log(e)
      Queue.failure({ task, error: e })
    }
  },

  success: (res) => {
    //console.log('removed worker')
    Queue.workers.shift();
    if(Array.isArray(res)){
      Queue.result.push(...res)
    } else {
      Queue.result.push(res)
    }
    Queue.enqueue()
  },

  failure: (error) => {
    Queue.workers.shift()
    Queue.result.push(error)
    Queue.enqueue()
  },

  result: [],

  enqueue: () => {

    Queue.progress();

  	if(Queue.tasks.length > 0){

  	  if(Queue.concurrencyLimit()){
    		Queue.work(Queue.tasks[0]);
    		Queue.tasks.shift()
    		Queue.enqueue()
  	  }
  	} else if(Queue.tasks.length < 1 && Queue.workers.length === 0) {
  	  myEmitter.emit('done');
  	}
  },

  start: async (tasks, concurrency, url, type, industry, page) =>{
    browser = await Puppeteer.launch({
      headless
    });
    Queue.tasks = tasks;
    Queue.originalTask = tasks.length;
    Queue.url = url;
    Queue.type = type;
    Queue.result = [];
    Queue.concurrency = (concurrency) ? concurrency : 2;
    Queue.enqueue();
    Queue.industry = (industry) ? industry : "";
    Queue.page = (page) ? page : 1;
    return new Promise((res, rej)=>{
      myEmitter.on('done', async () => {
        await browser.disconnect()
        await browser.close()
        myEmitter.removeAllListeners();
        res(Queue.result)
      });
    })
  }

}

module.exports = { Queue, Intro }
