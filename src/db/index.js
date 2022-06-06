const { MongoClient } = require('mongodb');
const fs = require('fs');


// Read the certificate authority
// var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];

// // Connect validating the returned certificates from the server
// MongoClient.connect("mongodb://localhost:27017/test?ssl=true", {
//   sslValidate:true,
//   sslCA:ca
// }, function(err, db) {
//   db.close();
// });

let text = fs.readFileSync(__dirname + '/ca-cert.crt');
text = text.toString();
let ca = [text];
// var ca = [text.toString()];
// let uri = `mongodb://${config.db.DB_USER}:${config.db.DB_PASS}@${config.db.DB_HOST}/${config.db.DB_NAME}?ssl=true`
let uri = 'mongodb+srv://coltrane:jV4v3028le615GzF@totem-11027949.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=totem';

const mongo = new MongoClient(uri, {
		tls: true,
		tlsCAFile: __dirname + '/ca-cert.crt'
 });
async function connect() {
  // Use connect method to connect to the server
  	console.log('attemtping to connect')
  	await mongo.connect()

 	console.log('connected!');

  // const db = mongo.db(config.db.DB_NAME);
}

connect()
  .then(console.log)
  .catch(console.error);

module.exports = mongo;