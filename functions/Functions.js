const Puppeteer =  require('puppeteer');
const EventEmitter = require('events');

//RUN PUPPETEER HEADLESSLY?
const headless = true;
let browser;

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const Queue = {

  workers: [],

  concurrency: 1,

  tasks: [],

  url: "",

  type: "",

  concurrencyLimit: () =>{
    return (Queue.workers.length <= Queue.concurrency) ? true : false
  },

  compute: (task) => {
	  return new Promise(async (res, rej) =>{
      try{
        let page = await browser.newPage()
        await page.goto( Queue.url + task, { waitUntil: 'load' });
        let data;
        switch(Queue.type){
          case "prodCodes":
            data = await page.evaluate(() => {
              let result = Array.from(document.querySelectorAll('.alinks3'));
              return result.map(u => u.href.split('?prod_code=')[1])
            });
          break;
          case "companyIDs":
            data = await page.evaluate(() => {
              let result = Array.from(document.querySelectorAll('#divListing > .firstLine > .divLeft > a'));
              return result.map(u => u.href.split('?company=')[1])
            });
          break;
          case "finalData":
            data = await page.evaluate(() => {

              let name = document.querySelector('h1[itemprop="name"]').innerText;
              let address = document.querySelector('div[itemprop="address"] > span:nth-child(2)').innerText.replace(/(\r\n\t|\n|\r\t)/gm,"");
              let phone = document.querySelector('span[itemprop="telephone"]').innerText;
              let website = document.querySelector('a[itemprop="url"]').href;

              return { name, address, phone, website }
            });
          break;
          default:
          break;
        }
        console.log(data)
        res(data)
      } catch(e) {
        rej(e)
      }
    })
  },

  work: async (task) => {
    console.log('asigned to queue: ' + task)
    try{
      Queue.workers.push('working');
      let res = await Queue.compute(task);
      Queue.workers.shift();
      Queue.success(res)
    } catch(e){
      Queue.failure('error' + task)
    }
  },

  success: (res) => {
    if(Array.isArray(res)){
      Queue.result.push(...res)
    } else {
      Queue.result.push(res)
    }
    Queue.enqueue()
  },

  failure: (error) => {
    Queue.result.push(error)
  },

  result: [],

  enqueue: () => {
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

  start: async (tasks, concurrency, url, type) =>{
    browser = await Puppeteer.launch({ headless });
    Queue.tasks = tasks;
    Queue.url = url;
    Queue.type = type;
    Queue.result = [];
    Queue.concurrency = (concurrency) ? concurrency : 2;
    Queue.enqueue();
    return new Promise((res, rej)=>{
      myEmitter.on('done', async () => {
        await browser.close()
        res(Queue.result)
      });
    })
  }

}

module.exports = { Queue }
