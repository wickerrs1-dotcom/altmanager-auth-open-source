const RingBuffer=require('../logging/ringBuffer')
const path=require('path')
const fs=require('fs')
const store={buffers:{}}
function ensure(alt){if(!store.buffers[alt]) store.buffers[alt]=new RingBuffer(500)}
function append(alt,line){ensure(alt);store.buffers[alt].push(line);try{fs.appendFileSync(path.join('logs','alts',`${alt}.log`),line+'\n')}catch(e){}
}
function getTail(alt,n=50){ensure(alt);return store.buffers[alt].tail(n)}
module.exports={append,getTail}
