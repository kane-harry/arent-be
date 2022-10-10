import { config } from '@config'
import { buyNftProcess, acceptOfferProcess } from '@modules/queues/nfts-queue-consumer'

import Queue from 'bull'

// const myQueue = new Queue('myJob', 'redis://127.0.0.1:6379');
const buyProductQueue = new Queue('buyNft', {
    redis: { host: config.redis.redisURL, port: config.redis.redisPort },
    defaultJobOptions: { attempts: 1, removeOnComplete: true },
    limiter: { max: 10, duration: 1000 }
})
buyProductQueue.process(buyNftProcess)

const addToBuyProductQueue = async (data: any) => {
    await buyProductQueue.add(data)
    return { success: true, message: 'Job in queue ! Please check result later.' }
}

// const myQueue = new Queue('myJob', 'redis://127.0.0.1:6379');
const acceptOfferQueue = new Queue('acceptOffer', {
    redis: { host: config.redis.redisURL, port: config.redis.redisPort },
    defaultJobOptions: { attempts: 1, removeOnComplete: true },
    limiter: { max: 10, duration: 1000 }
})
acceptOfferQueue.process(acceptOfferProcess)

const addToAcceptOfferQueue = async (data: any) => {
    await acceptOfferQueue.add(data)
    return { success: true, message: 'Job in queue ! Please check result later.' }
}

export { addToBuyProductQueue, addToAcceptOfferQueue }
