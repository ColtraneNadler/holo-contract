const Redis = require('ioredis');
const connectionString = 'rediss://clustercfg.totem-cluster.e3uoor.memorydb.us-east-1.amazonaws.com';
const nodes = [{
    host: 'clustercfg.totem-cluster.e3uoor.memorydb.us-east-1.amazonaws.com',
    port: '6379',
}];
const options = {
    redisOptions: {
        tls: {
            checkServerIdentity: (servername, cert) => {
                // skip certificate hostname validation
                return undefined;
            },
        }
    }
}

const redis = new Redis.Cluster(nodes, options);

module.exports = redis;