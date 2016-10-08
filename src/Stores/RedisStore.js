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
const co = require('co')
const TaggableStore = require('./TaggableStore')
const Util = require('../Util')
const RedisTaggedCache = require('./RedisTaggedCache')
const TagSet = require('./TagSet')

class RedisStore extends TaggableStore {

  constructor (Redis, prefix = '', connection = 'default') {
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
  get (key) {
    return co(function * () {
      return Util.deserialize(yield this.connection().get(this._prefix + key))
    }.bind(this))
  }

  /**
   * Retrieve multiple items from the cache by key.
   *
   * Items not found in the cache will have a null value.
   *
   * @param  {Array<string>}  keys
   * @return {Promise<array>}
   */
  many (keys) {
    return co(function * () {
      let mappedValues = {}
      for (let i = 0; i < keys.length; i++) {
        mappedValues[keys[i]] = yield this.get(keys[i])
      }
      return mappedValues
    }.bind(this))
  }

  /**
   * Store an item in the cache for a given number of minutes.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  put (key, value, minutes = 0) {
    return co(function * () {
      const prefixedKey = this._prefix + key
      let expiration = Math.floor(minutes * 60)
      const serializedValue = Util.serialize(value)

      if (isNaN(expiration) || expiration < 1) {
        expiration = 1
      }

      yield this.connection().setex(prefixedKey, expiration, serializedValue)
    }.bind(this))
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  object
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  putMany (object, minutes) {
    return co(function * () {
      for (let prop in object) {
        yield this.put(prop, object[prop], minutes)
      }
    }.bind(this))
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  increment (key, value = 1) {
    return co(function * () {
      try {
        return yield this.connection().incrby(this._prefix + key, value)
      } catch (error) {
        if (error.name === 'ReplyError') {
          return false
        } else {
          throw error
        }
      }
    }.bind(this))
  }

  /**
   * Decrement the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  decrement (key, value = 1) {
    return co(function * () {
      try {
        return yield this.connection().decrby(this._prefix + key, value)
      } catch (error) {
        if (error.name === 'ReplyError') {
          return false
        } else {
          throw error
        }
      }
    }.bind(this))
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  forever (key, value) {
    return co(function * () {
      yield this.connection().set(this._prefix + key, Util.serialize(value))
    }.bind(this))
  }

  /**
   * Remove an item from the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  forget (key) {
    return co(function * () {
      yield this.connection().del(this._prefix + key)
      return true
    }.bind(this))
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  flush () {
    return co(function * () {
      yield this.connection().flushdb()
    }.bind(this))
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
