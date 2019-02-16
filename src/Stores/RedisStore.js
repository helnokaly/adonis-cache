'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const TaggableStore = require('./TaggableStore')
const Util = require('../Util')
const RedisTaggedCache = require('./RedisTaggedCache')
const TagSet = require('./TagSet')

class RedisStore extends TaggableStore {
  constructor (Redis, prefix = '', connection) {
    super()
    this._redis = Redis
    this._prefix = prefix
    this.setPrefix(prefix)
    this.setConnection(connection)
  }

  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string} key
   * @return {Promise<mixed>}
   */
  async get (key) {
    return Util.deserialize(await this.connection().get(this._prefix + key))
  }

  /**
   * Retrieve multiple items from the cache by key.
   *
   * Items not found in the cache will have a null value.
   *
   * @param  {Array<string>}  keys
   * @return {Promise<array>}
   */
  async many (keys) {
    let values = await Promise.all(keys.map(key => this.get(key)))
    let mappedValues = {}
    for (let i = 0; i < keys.length; i++) {
      mappedValues[keys[i]] = values[i]
    }
    return mappedValues
  }

  /**
   * Store an item in the cache for a given number of minutes.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {int|float}     minutes
   * @return {Promise<void>}
   */
  async put (key, value, minutes = 0) {
    const prefixedKey = this._prefix + key
    let expiration = Math.floor(minutes * 60)
    const serializedValue = Util.serialize(value)

    if (isNaN(expiration) || expiration < 1) {
      expiration = 1
    }

    await this.connection().setex(prefixedKey, expiration, serializedValue)
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  object
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  async putMany (object, minutes) {
    for (let prop in object) {
      await this.put(prop, object[prop], minutes)
    }
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  async increment (key, value = 1) {
    try {
      return await this.connection().incrby(this._prefix + key, value)
    } catch (error) {
      if (error.name === 'ReplyError') {
        return false
      } else {
        throw error
      }
    }
  }

  /**
   * Decrement the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  async decrement (key, value = 1) {
    try {
      return await this.connection().decrby(this._prefix + key, value)
    } catch (error) {
      if (error.name === 'ReplyError') {
        return false
      } else {
        throw error
      }
    }
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  async forever (key, value) {
    await this.connection().set(this._prefix + key, Util.serialize(value))
  }

  /**
   * Remove an item from the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  async forget (key) {
    await this.connection().del(this._prefix + key)
    return true
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  async flush () {
    await this.connection().flushdb()
  }

  /**
   * Begin executing a new tags operation.
   *
   * @param  array|mixed  $names
   * @return {RedisTaggedCache}
   */
  tags (names) {
    names = Array.isArray(names) ? names : Array.from(arguments)
    return new RedisTaggedCache(this, new TagSet(this, names))
  }

  /**
   * Get the Redis connection instance
   *
   * @return {Object}
   *
   */
  connection () {
    return this._redis.connection(this._connection)
  }

  /**
   * Set the connection name to be used
   *
   * @param {string} connection
   * @return {void}
   */
  setConnection (connection) {
    this._connection = connection
  }

  /**
   * Get the Redis database instance
   *
   * @return {object}
   */
  getRedis () {
    return this._redis
  }

  /**
   * Get the cache key prefix
   *
   * @return {string}
   */
  getPrefix () {
    return this._prefix
  }

  /**
   * Set the cache key prefix
   *
   * @param {string} prefix
   * @return {void}
   */
  setPrefix (prefix) {
    this.prefix = !_.isEmpty(prefix) ? prefix + ':' : ''
  }
}

module.exports = RedisStore
