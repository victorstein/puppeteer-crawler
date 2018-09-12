const Puppeteer =  require('puppeteer');
const EventEmitter = require('events');

//RUN PUPPETEER HEADLESSLY?
const headless = false;
let browser;

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const Queue = {

  workers: [],

  concurrency: 1,

  tasks: [],

  url: "",

  type: "",

  ipPool: [
    "--proxy-server=https=64.246.99.22:43401",
    "--proxy-server=https=199.189.150.158:54321",
    "--proxy-server=https=74.118.205.95:54321",
    "--proxy-server=https=66.191.60.87:64312",
    "--proxy-server=https=71.125.211.240:54321",
    "--proxy-server=https=12.183.155.234:35776",
    "--proxy-server=https=68.165.98.146:54321",
    "--proxy-server=https=40.132.86.82:54321",
    "--proxy-server=https=66.232.169.170:54321",
    "--proxy-server=https=66.232.169.161:54321",
    "--proxy-server=https=74.118.205.104:54321",
    "--proxy-server=https=66.232.169.168:54321",
    "--proxy-server=https=74.118.205.120:54321",
    "--proxy-server=https=74.118.204.221:54321",
    "--proxy-server=https=72.14.20.134:54321",
    "--proxy-server=https=71.42.79.206:54321",
    "--proxy-server=https=50.25.21.149:54321",
    "--proxy-server=https=74.118.205.83:54321",
    "--proxy-server=https=162.243.132.149:4570"
  ],

  concurrencyLimit: () =>{
    return (Queue.workers.length <= Queue.concurrency) ? true : false
  },

  compute: (task) => {
	  return new Promise(async (res, rej) =>{
      try{
        let index = Math.floor(Math.random() * Queue.ipPool.length);
        console.log(Queue.ipPool[index])
        browser = await Puppeteer.launch({
          headless,
          args: [Queue.ipPool[index]]
        });
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
