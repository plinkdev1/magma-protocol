(function() {
  var _define = Object.defineProperty;
  Object.defineProperty = function(obj, prop, desc) {
    try { return _define(obj, prop, desc); } catch(e) { return obj; }
  };
})();