var mongoq =        require("mongoq");
var mongo =         'mongodb://x:x@192.168.0.130:27017/x';
var db =            mongoq(mongo, { safe: false, strict: false });

module.exports = db;