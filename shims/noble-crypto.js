// Shim for @noble/hashes/crypto.js
var cr = global.crypto || { getRandomValues: function(arr) { for(var i=0;i<arr.length;i++) arr[i]=Math.floor(Math.random()*256); return arr; } };
module.exports = { crypto: cr };