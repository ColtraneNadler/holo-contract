const Web3 = require('web3')
const mongo = require('../db');
const dbName = 'xelaearth';
const db = mongo.db(dbName);
let Xoid = db.collection('xoids');

const config = require('../../config')
const Multicall = require('@dopex-io/web3-multicall');


const ethWeb3 = new Web3('https://eth-mainnet.gateway.pokt.network/v1/lb/624681a78f496c003a4bf210');
// const rpc = 'https://rpc-mumbai.matic.today';

let rpc = 'https://eth-mainnet.gateway.pokt.network/v1/lb/624681a78f496c003a4bf210';

const web3 = new Web3(rpc);
const xoidContract = new web3.eth.Contract(
	config.abis.erc721, 
	config.addresses.prod.xoid1 // config.addresses.dev.xoid1
);

const mission1Contract = new web3.eth.Contract(
	config.abis.mission1,
	config.addresses.prod.mission1
);

const mission2Contract = new web3.eth.Contract(
	config.abis.mission2,
	config.addresses.prod.mission2
);

module.exports.balanceOf = async (address) => {
	let balance = await xoidContract.methods.balanceOf(address).call();
	let staked = await getDeposits(address);
	return parseInt(balance) + parseInt(staked);
}

async function getDeposits(address) {
	let deposits = await Promise.all([
		mission1Contract.methods.getUserDeposits(address).call(),
		mission2Contract.methods.getUserStaking(address).call()
	])

	if((!deposits[0].length || !deposits[0][0].length) && !deposits[1].length) return 0;
	// if(!deposits[0].length !deposits[0][0].length) return 0;

	return 1;
}

const fs = require('fs');

(async function() {
	// let deposits = await getDeposits('0xe250b0B2FCd475F5aBfF2c090cc53a4A305e9229');
	// console.log(deposits)

	const maycContract = new web3.eth.Contract(
		config.abis.erc721, 
		'0x60e4d786628fea6478f785a6d7e704777c86a7c6' // config.addresses.dev.xoid1
	);

	let owners = new Set();

	for(let j = 0; j < 19000; j++) {
		console.log(j)
		let owner = await maycContract.methods.ownerOf(j).call();
		owners.add(owner);
	}

	fs.writeFile(__dirname + '/mayc.json', JSON.stringify([...owners]));
})()