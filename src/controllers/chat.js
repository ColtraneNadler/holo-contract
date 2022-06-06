const redis = require('../redis');

/**
 * get user
 */
async function getChatHistory(req, res) {
	let chat_history = await redis.lrange('messages', 0, 50);
	chat_history = chat_history.map(c => ({ ...JSON.parse(c), address: undefined }));
	res.json({ chat_history })
}

module.exports = {
	getChatHistory
}