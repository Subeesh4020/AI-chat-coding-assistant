import { RedisClientInfra } from './'; 

let pubRedisInfra: RedisClientInfra;
let subRedisInfra: RedisClientInfra;

export async function initPubSubRedis(pubRedisName: string, subRedisName: string) {
  
  pubRedisInfra = new RedisClientInfra(pubRedisName);
  subRedisInfra = new RedisClientInfra(subRedisName);

  await pubRedisInfra.init();
  await subRedisInfra.init();

  await pubRedisInfra.testRedisConnection();
  await subRedisInfra.testRedisConnection();
}
    
export function getPubSubRedisInfra(label: string) {
  if (label === 'sub-redis-infra') {
    return subRedisInfra;
  } else {
    return pubRedisInfra;
  }
}

export async function closePubSubRedis() {
  if(pubRedisInfra) {
    await pubRedisInfra.redisGracefulShutdown();
  }

 if(subRedisInfra) {
    await subRedisInfra.redisGracefulShutdown();
  }
}