const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
const jwt = require('jsonwebtoken');
const SECRET = 'storyboard$1segret';

const { ObjectID } = require('mongodb');
const mongo = require('../db');
const xoids = require('../utils/xoid');

const dbName = 'xelaearth';
const db = mongo.db(dbName);
let User = db.collection('users');
let Checkpoint = db.collection('checkpoints');
let TimeTrial = db.collection('timetrial_entries');

setTimeout(async () => {
	// TimeTrial.deleteMany({})
	let times= await TimeTrial.count({});
	console.log(times);
}, 2000)



let timeout = ms => new Promise(res => setTimeout(res, ms));
// (async function() {
// 	console.log('waiting');
// 	await timeout(1000);
// 	console.log('going')

// 	let user = await User.findOne({ public_key: '0xA2b172EC58FE90Df8d4a84Cbd8d0f8E7bFF3f23A' });
// 	console.log('got user', user)
// 	let select = await Checkpoint.find({ user_id: user._id })
// 	let checkpoints = await select.toArray();
// 	Checkpoint.deleteOne({ user_id: user._id })
// 	console.log(checkpoints)
// })()

/**
 * middleware
 */
async function middleware(req, res, next) {
    if(!(req.headers.authorization && req.headers.authorization.indexOf('Bearer') > -1))
        return next();

    let token = req.headers.authorization.split(' ')[1];
	let decoded = await jwt.verify(token, SECRET);

	let user = await User.findOne({ _id: new ObjectID(decoded.data._id) } );
	if(!user) return next();

	token = jwt.sign({
			data: { _id: user._id, username: user.username }
		}, SECRET, { expiresIn: '14d' });

	req.token = token;
	req.user = user;
	next();
}

/**
 * auth middleware
 */
async function auth(req, res, next) {
	if(!req.user) return res.send(404);
	next();
}

/**
 * get user
 */
async function getUser(req, res) {
	let { pk } = req.query;

	let user = await User.findOne({ public_key: pk })
	if(!user) return res.json(null);

	res.json(user);
}

/**
 * GET
 * Check to see if a username is available
 *
 * @query - String username
 */
async function checkUsername(req, res) {
	let { username } = req.query;
	let user = await User.findOne({ username });

	if(!user) res.json({ available: true });
	else res.json({ available: false });
}

/**
 * post user
 */
async function postUser(req, res) {
	let {
		username,
		public_key,
		signature
	} = req.body;

	let user = await User.findOne({ $or: [{public_key}, {username}] })
	if(user) return res.send(502); // already exists

	// create new user in database
	user = await User.insertOne({
		username,
		public_key
	})

	// create jwt
	const token = jwt.sign({
			data: { id: user.id, username: user.username }
		}, SECRET, { expiresIn: '14d' });

	res.json({
		user, 
		token
	});
}


/**
 * POST
 * Validates signature from cryto wallet for authentication
 *
 * @param - String token
 * or
 * @param - String public_key 
 * @param - String signature
 */
async function postAuthenticate(req, res) {
	let {
		public_key,
		signature,
		token
	} = req.body;

	let select;
	let xoidBalance, checkpoints;

	if(token) {
		let decoded = await jwt.verify(token, SECRET);
		let o_id = new ObjectID(decoded.data._id);
		let user = await User.findOne({ _id: o_id} );

		if(!user) return res.send(404); // this shouldnt happen

		select = await Checkpoint.find({ user_id: o_id });
		checkpoints = await select.toArray();

		token = jwt.sign({
				data: { _id: user._id, username: user.username }
			}, SECRET, { expiresIn: '14d' });

		xoidBalance = await xoids.balanceOf(user.public_key);
		return res.json({
    		xoidHolder: parseInt(xoidBalance) != 0,
    		checkpoints: checkpoints.map(c => c.type),
    		user,
    		token
    	});
	}

	let user = await User.findOne({
		public_key
	});

	let nonce
	if(!user)
		nonce = 1;
	else
		nonce = user.nonce;

	const msg = `Totem uses this cryptographic signature in place of a password, verifying that you are the owner of this Ethereum address - ${nonce}`;

    // We now are in possession of msg, publicAddress and signature. We
    // can perform an elliptic curve signature verification with ecrecover
    const msgBuffer = ethUtil.toBuffer(Web3.utils.utf8ToHex(msg));
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);

	nonce = Math.floor(Math.random() * 1000000);
	if(user)
		await User.updateOne({ public_key }, { $set: { nonce } });
	else 
		// create new user in database
		user = await User.insertOne({
			public_key,
			nonce
		})

	xoidBalance = await xoids.balanceOf(public_key);

	select = await Checkpoint.find({ user_id: user._id });
	checkpoints = await select.toArray();
    // The signature verification is successful if the address found with
    // ecrecover matches the initial publicAddress
    if (address.toLowerCase() === public_key.toLowerCase()) {
    	// create jwt
		const token = jwt.sign({
				data: { _id: user._id, username: user.username }
			}, SECRET, { expiresIn: '14d' });

    	res.json({
    		xoidHolder: parseInt(xoidBalance) != 0,
    		checkpoints: checkpoints.map(c => c.type),
    		user,
    		token
    	});
    } else {
      return res
        .status(401)
        .send({ error: 'Signature verification failed' });
    }
}

let types = ['init_video', 'key_controls', 'test']
/**
 * POST
 * stores player checkpoint
 *
 * @query - String type (the checkpoint value)
 */
async function postCheckpoint(req, res) {
	let { type } = req.body;
	type = type.toLowerCase();

	if(!types.includes(type)) return res.send(404);
	let checkpoint = await Checkpoint.findOne({ $and: [{user_id: req.user._id, type }] })
	if(checkpoint) return res.send(504);
	await Checkpoint.insertOne({ user_id: new ObjectID(req.user._id), type });
	res.json({ success: true })
}  

async function getTimetrialLeaderboards(req, res) {
	let entries = await TimeTrial.find().sort({ time: 1 }).limit(50).toArray();
	let keys = [];
	let sortedEntries = entries.filter(e => {
		if(keys.indexOf(e.name) > -1) return false;

		keys.push(e.name)
		return true;
	});
	res.json(sortedEntries.slice(0,5));
}

async function postTimetrial(req, res) {
	let { name, time } = req.body;

	let entry = await TimeTrial.insertOne({
		name,
		time,
		user_id: req.user._id,
		createdAt: Date.now()
	})

	res.json({ success: true });
}

module.exports = {
	auth,
	middleware,
	getUser,
	postUser,
	postAuthenticate,
	postCheckpoint,

	postTimetrial,
	getTimetrialLeaderboards
}