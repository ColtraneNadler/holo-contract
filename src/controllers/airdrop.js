const mongo = require('../db');
const Web3 = require('web3');
const dbName = 'xelaearth';
const db = mongo.db(dbName);
const Airdrop = db.collection('airdrops');
const KeyAirdrop = db.collection('key_airdrops'); // join collection
const config = require('../../config');

const { ObjectID } = require('mongodb');
const address = config.keys.dev.public;
const privateKey = config.keys.dev.private;
// const infuraUrl = 'https://rpc-mumbai.matic.today'; 
const infuraUrl = 'https://polygon-rpc.com';

const { balanceOf } = require('../utils/xoid');

let timeout = ms => new Promise(res => setTimeout(res, ms));
// (async function() {
// 	console.log('yo!')
// 	await timeout(1000)
// 	let keys = await KeyAirdrop.findOne({})
// 	console.log(keys)
// 	// await KeyAirdrop.deleteMany({ });
// })()

// back fill 
(async function() {


	await timeout(1000)
	let airdrops = await KeyAirdrop.find({ status: 'pending' });
	airdrops = await airdrops.toArray();
	console.log(airdrops.length)
	

	for(let j = 0; j < airdrops.length; j++) {
		try {
			await mint(airdrops[j].public_key);
			await KeyAirdrop.updateOne({_id: new ObjectID(airdrops[j]._id)}, { $set: { status: 'completed'} });
			console.log('minted and updated!')
		} catch(err) {
			if(err.toString().includes('already have a key')) {
				await KeyAirdrop.updateOne({_id: new ObjectID(airdrops[j]._id)}, { $set: { status: 'completed'} });
			} else {
				console.log(err);
				return;
			}
		}
	}
})()


async function mint(receiver) {
	const web3 = new Web3(infuraUrl);
	const networkId = await web3.eth.net.getId();

	const keyContract = new web3.eth.Contract(config.abis.key1, config.addresses.prod.key1);
	const tx = keyContract.methods.mint(receiver);
	const gas = await tx.estimateGas({from: address});
	// const gasPrice = await web3.eth.getGasPrice();
	const data = tx.encodeABI();
	const nonce = await web3.eth.getTransactionCount(address);

	const signedTx = await web3.eth.accounts.signTransaction(
		{
			to: keyContract.options.address, 
			data,
			gas: gas + 100000,
			// gasPrice,
			nonce, 
			chainId: networkId
		},
		privateKey
	);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
	console.log(`Transaction hash: ${JSON.stringify(receipt)}`);
}

// (async function load() {
// 	console.log('loading!');
// 	try { 
// 		await mint('0xf5e77fFB06C6a1231b85418a523F84A3AaEc7B3C');
// 	} catch(err) {
// 		console.log('got an error!')
// 		console.log(err)
// 	}
// })()

// const xoidAddress = '0x12bb5bf8a166098e1839d3f1396d73ac3fe42926';
// const erc721abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"CIRCULATING_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_MINT_COUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINT_NFT_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"NFT_MINTED_PER_USER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRE_SALE_TIME_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRE_SALE_TIME_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"PRE_SALE_WHITELIST_ADDRESSES","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PUBLIC_SALE_TIME_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XOIDS_ADMIN_WALLET","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"users","type":"address[]"}],"name":"adminMintMulAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"adminMintMulNft","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isAdminXOiDsNftMinted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintAdminXOiDsNft","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"preSaleMint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"publicSaleMint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"baseURI_","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"addresses","type":"address[]"}],"name":"setPreSaleWhiteListAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawEth","outputs":[],"stateMutability":"nonpayable","type":"function"}]
module.exports.postAirdrop = async (req, res) => {
	let user = req.user;
	let xoidBalance = await balanceOf(user.public_key);
	if(xoidBalance == 0) return res.send(509);

	// let airdrop = await Airdrop.findOne({ id: req.body.airdrop });
	// if(!airdrop) return res.send(404);

	// check if airdropped
	let keyAirdrop = await KeyAirdrop.findOne({ 
			// {airdrop_id: airdrop.id},
		public_key: user.public_key
	})

	// return if already received
	if(keyAirdrop) return res.send(509);
	keyAirdrop = await KeyAirdrop.insertOne({ 
		public_key: user.public_key, 
		status: 'pending' 
	})

	// let airdropContract = new web3.eth.Contract(con airdrop.tokenAddress);
	let tokenId;
	try {
		await mint(user.public_key);
		await KeyAirdrop.updateOne({_id: new ObjectID(keyAirdrop._id)}, { $set: { status: 'completed'} });
		res.json({ success: true });
	} catch(err) {
		console.log('got an error', err);
		await KeyAirdrop.deleteOne({_id: new ObjectID(keyAirdrop._id)});
		res.json({ success: false });
	}
}