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
        var page = await browser.newPage()

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
                  return result.map(u => u.href.split('?groupid=')[1])
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
            await page.goto('about:blank')
            await page.close();
            res(data)

          } else {

            await page.waitFor('.btn-green');

          }
        } catch(e) {
          console.log(e + ' in task ' + task)
          console.log('removed worker')
          Queue.workers.shift();
          await page.goto('about:blank')
          await page.close();
          Queue.work(task);
        }
    })
  },

  work: async (task) => {
    console.log('asigned to queue: ' + task)
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
    console.log('removed worker')
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
    console.log(
      'ran enqueue',
      'the tasks length is: ' + Queue.tasks.length,
      'the amount of workers is: ' + Queue.workers.length
    )
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
    browser = await Puppeteer.launch({
      headless
    });
    Queue.tasks = tasks;
    Queue.url = url;
    Queue.type = type;
    Queue.result = [];
    Queue.concurrency = (concurrency) ? concurrency : 2;
    Queue.enqueue();
    return new Promise((res, rej)=>{
      myEmitter.on('done', async () => {
        await browser.disconnect()
        res(Queue.result)
      });
    })
  }

}

module.exports = { Queue }
