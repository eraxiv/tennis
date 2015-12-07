var mongoq =        require("mongoq");
var mongo =         'mongodb://[username]:[password]@[connection]:[port]/[db]';
var db =            mongoq(mongo, { safe: false, strict: false });

module.exports = db;
