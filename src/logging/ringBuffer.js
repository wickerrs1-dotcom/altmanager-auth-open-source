class RingBuffer{
  constructor(size=200){this.size=size;this.buf=[]}
  push(line){this.buf.push(line);if(this.buf.length>this.size) this.buf.shift()}
  tail(n=50){return this.buf.slice(-n)}
}
module.exports=RingBuffer
