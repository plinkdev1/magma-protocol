// CommonJS crypto shim for Hermes
global.crypto = global.crypto || {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }
};
module.exports = global.crypto;