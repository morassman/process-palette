/** @babel */

export default class Buffer {

  constructor(maxSize){
    this.maxSize = maxSize;
    this.size = 0;
    this.array = [];
  }

  push(data) {
    this.size += data.length;
    this.array.push(data);

    if ((this.maxSize == null)) {
      return;
    }

    return (() => {
      const result = [];
      while (this.size > this.maxSize) {
        const diff = this.size - this.maxSize;

        if (diff < this.array[0].length) {
          this.array[0] = this.array[0].slice(diff);
          result.push(this.size -= diff);
        } else {
          const discard = this.array.shift();
          result.push(this.size -= discard.length);
        }
      }
      return result;
    })();
  }

  clear() {
    this.size = 0;
    return this.array = [];
  }

  getLineCount() {
    return this.array.length;
  }

  toString() {
    return this.array.join("");
  }

}
