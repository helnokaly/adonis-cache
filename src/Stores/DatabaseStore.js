'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Util = require('../Util')

class DatabaseStore {
  constructor (connection, tableName, prefix = '') {
    this._connection = connection
    this._tableName = tableName
    this._prefix = prefix

    /**
     * Probability (parts per million) that garbage collection (GC) should be performed
     * when storing a piece of data in the cache. Defaults to 100, meaning 0.01% chance.
     * This number should be between 0 and 1000000. A value 0 meaning no GC will be performed at all.
     */
    this._gcProbability = 100;
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
  async get (key) {
    const cache = await this._table().where('key', this._prefix + key).first()

    if (cache === undefined) {
      return null
    }

    if (Date.now() / 1000 >= cache.expiration) {
      await this.forget(key)
      return null
    }

    return Util.deserialize(cache.value)
  }

  /**
   * Retrieve multiple items from the cache by key.
   *
   * Items not found in the cache will have a null value.
   *
   * @param  {Array<string>}  keys
   * @return {Promise<object>}
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
    const serializedValue = Util.serialize(value)
    const expiration = Math.floor((Date.now() / 1000) + minutes * 60)

    try {
      await this._table().insert({key: prefixedKey, value: serializedValue, expiration: expiration})
    } catch (e) {
      await this._table().where('key', prefixedKey).update({value: serializedValue, expiration: expiration})
    }

    // Call garbage collection function
    await this._gc()
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  values
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  async putMany (object, minutes) {
    let operations = []
    for (let prop in object) {
      operations.push(this.put(prop, object[prop], minutes))
    }
    await Promise.all(operations)
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
            const newValue = callback(currentValue)
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
  async forget (key) {
    await this._table().where('key', this._prefix + key).delete()
    return true
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  async flush () {
    await this._table().delete()
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

  /**
   * Removes the expired data values.
   * @param {bool} force whether to enforce the garbage collection regardless of [[gcProbability]].
   * Defaults to false, meaning the actual deletion happens with the probability as specified by [[gcProbability]].
   */
  async _gc (force = false) {
    if (force || Util.randomIntBetween(0, 1000000) < this._gcProbability) {
      await this._table().where('expiration', '<=', Math.floor(Date.now() / 1000)).delete()
    }
  }
}

module.exports = DatabaseStore
