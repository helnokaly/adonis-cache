'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const co = require('co')
const Util = require('../Util')

class DatabaseStore {

  constructor (connection, tableName, prefix = '') {
    this._connection = connection
    this._tableName = tableName
    this._prefix = prefix
  }

  /**
   * Return a new query builder instance with cache's table set
   *
   * @returns {mixed}
   * @private
   */
  _table () {
    return this._connection.table(this._tableName)
  }

  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string} key
   * @return {Promise<mixed>}
   */
  get (key) {
    return co(function * () {
      const cache = yield this._table().where('key', this._prefix + key).first()

      if (cache === undefined) {
        return null
      }

      if (Date.now() / 1000 >= cache.expiration) {
        yield this.forget(key)
        return null
      }

      return Util.deserialize(cache.value)
    }.bind(this))
  }

  /**
   * Retrieve multiple items from the cache by key.
   *
   * Items not found in the cache will have a null value.
   *
   * @param  {Array<string>}  keys
   * @return {Promise<object>}
   */
  many (keys) {
    return co(function * () {
      let mappedValues = {}
      for (let key of keys) {
        mappedValues[key] = this.get(key)
      }
      return yield mappedValues
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
      const serializedValue = Util.serialize(value)
      const expiration = Math.floor((Date.now() / 1000) + minutes * 60)

      try {
        yield this._table().insert({key: prefixedKey, value: serializedValue, expiration: expiration})
      } catch (e) {
        yield this._table().where('key', prefixedKey).update({value: serializedValue, expiration: expiration})
      }
    }.bind(this))
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  values
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
    return this._incrementOrDecrement(key, value, (currentValue) => {
      return currentValue + value
    })
  }

  /**
   * Decrement the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  decrement (key, value = 1) {
    return this._incrementOrDecrement(key, value, (currentValue) => {
      return currentValue - value
    })
  }

  /**
   * Increment or decrement the value of an item in the cache.
   *
   * @param {string}    key
   * @param {mixed}     value
   * @param {function}  callback
   * @return {Promise<int|boolean>}
   *
   * @private
   */
  _incrementOrDecrement (key, value, callback) {
    return new Promise((resolve, reject) => {
      this._connection.transaction(trx => {
        const prefixedKey = this._prefix + key
        return trx.table(this._tableName).where('key', prefixedKey).forUpdate().first()
          .then(r => {
            if (r === undefined) {
              resolve(false)
              return
            }
            const currentValue = parseInt(r.value)
            if (isNaN(currentValue)) {
              resolve(false)
              return
            }
            const newValue = Util.serialize(callback(currentValue))
            return trx.table(this._tableName).where('key', prefixedKey).update('value', newValue)
              .then(r => resolve(newValue))
          })
          .catch(error => reject(error))
      })
    })
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  forever (key, value) {
    return this.put(key, value, 5256000)
  }

  /**
   * Remove an item from the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  forget (key) {
    return co(function * () {
      yield this._table().where('key', this._prefix + key).delete()
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
      yield this._table().delete()
    }.bind(this))
  }

  /**
   * Get the underlying database connection.
   *
   * @return {Object} database connection
   */
  getConnection () {
    return this._connection
  }

  /**
   * Get the cache key prefix.
   *
   * @return {string}
   */
  getPrefix () {
    return this._prefix
  }

}

module.exports = DatabaseStore
