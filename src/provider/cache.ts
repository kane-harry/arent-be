import { createClient } from 'redis'
import { CONFIG } from '../configs'
import { loggingError } from '../logging'

export const client = CONFIG.REDIS_ENABLED ? createClient({ url: CONFIG.REDIS_URL }) : null

const connectRedis = async () => {
  if (!client?.isOpen) {
    await client?.connect()
  }
}

export const getByKey = async (key: string) => {
  const cacheKey = `${CONFIG.CACHE_PREFIX}_${key}`
  if (!CONFIG.REDIS_ENABLED) return null

  try {
    await connectRedis()
    return await client?.get(cacheKey)
  } catch (err) {
    loggingError({
      functionName: 'Redis.getByKey',
      data: {
        key
      },
      error_detail: String(err),
      stack: '',
      message: ''
    })
    return null
  }
}

export const setData = async (key: string, data: string, expiredSeconds: number): Promise<boolean> => {
  const cacheKey = `${CONFIG.CACHE_PREFIX}_${key}`
  if (!CONFIG.REDIS_ENABLED) return false

  try {
    await connectRedis()
    await client?.set(cacheKey, data, {
      EX: expiredSeconds
    })
    return true
  } catch (err) {
    loggingError({
      functionName: 'Redis.setData',
      data: {
        key
      },
      error_detail: String(err),
      stack: '',
      message: ''
    })
    return false
  }
}

export const delData = async (key: string) => {
  const cacheKey = `${CONFIG.CACHE_PREFIX}_${key}`
  if (!CONFIG.REDIS_ENABLED) return false

  try {
    await connectRedis()
    await client?.del(cacheKey)
    return true
  } catch (err) {
    loggingError({
      functionName: 'Redis.delData',
      data: {
        key
      },
      error_detail: String(err),
      stack: '',
      message: ''
    })
    return false
  }
}

export const getSortedSetDataByScore = async (key: string, minTimestamp: number, maxTimestamp: number) => {
  const cacheKey = `${CONFIG.CACHE_PREFIX}_${key}`
  if (!CONFIG.REDIS_ENABLED) return null

  try {
    await connectRedis()
    return await client?.zRangeByScore(cacheKey, minTimestamp, maxTimestamp)
  } catch (err) {
    loggingError({
      functionName: 'Redis.getSortedSetDataByScore',
      data: {
        key
      },
      error_detail: String(err),
      stack: '',
      message: ''
    })
    return null
  }
}

export const getSortedSetDataByAmount = async (key: string, amount: number) => {
  const cacheKey = `${CONFIG.CACHE_PREFIX}_${key}`
  if (!CONFIG.REDIS_ENABLED) return null

  try {
    await connectRedis()
    return await client?.zRange(cacheKey, 0, amount - 1)
  } catch (err) {
    loggingError({
      functionName: 'Redis.getSortedSetDataByAmount',
      data: {
        key
      },
      error_detail: String(err),
      stack: '',
      message: ''
    })
    return null
  }
}
