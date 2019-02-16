'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const TaggableStore = require('./TaggableStore')
const Util = require('../Util')

class ObjectStore extends TaggableStore {
  constructor () {
    super()
    this._storage = {}
  }

  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string} key
   * @return {Promise<mixed>}
   */
  async get (key) {
    const cache = this._storage[key]
    if (cache === undefined) {
      return null
    }
    if (Date.now() / 1000 >= cache.expiration) {
      this.forget(key)
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
  many (keys) {
    return Promise.all(keys.map(key => this.get(key)))
      .then(values => {
        let mappedValues = {}
        for (let i = 0; i < keys.length; i++) {
          mappedValues[keys[i]] = values[i]
        }
        return mappedValues
      })
  }

  /**
   * Store an item in the cache for a given number of minutes.
   *
   * @param  {string}  key
   * @param  {mixed}     value
   * @param  {int|float}     minutes
   * @return {Promise<void>}
   */
  put (key, value, minutes = 0) {
    return new Promise((resolve, reject) => {
      const expiration = Math.floor((Date.now() / 1000) + minutes * 60)
      this._storage[key] = {
        value: Util.serialize(value),
        expiration: expiration
      }
      resolve()
    })
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  object
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  putMany (object, minutes) {
    let promiseArray = []
    for (let prop in object) {
      promiseArray.push(this.put(prop, object[prop], minutes))
    }
    return Promise.all(promiseArray)
      .then(r => {})
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
      const cache = this._storage[key]
      if (cache === undefined) {
        resolve(false)
        return
      }
      const currentValue = parseInt(cache.value)
      if (isNaN(currentValue)) {
        resolve(false)
        return
      }
      const newValue = callback(currentValue)
      this._storage[key].value = newValue
      resolve(newValue)
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
    delete this._storage[key]
    return true
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  flush () {
    return new Promise((resolve, reject) => {
      this._storage = {}
      resolve()
    })
  }

  /**
   * Get the cache key prefix.
   *
   * @return string
   */
  getPrefix () {
    return ''
  }
}

module.exports = ObjectStore
