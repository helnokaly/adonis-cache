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

class NullStore extends TaggableStore {
  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string}  key
   * @return {Promise<mixed>}
   */
  async get (key) {
    return null
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
    let mappedValues = {}
    for (let key of keys) {
      mappedValues[key] = null
    }
    return mappedValues
  }

  /**
   * Store an item in the cache for a given number of minutes.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {float|int}  minutes
   * @return {Promise<void>}
   */
  async put (key, value, minutes) {
    return undefined
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  object
   * @param  {int}     minutes
   * @return {Promise<void>}
   */
  async putMany (object, minutes) {
    return undefined
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  async increment (key, value = 1) {
    return false
  }

  /**
   * Decrement the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<int|boolean>}
   */
  async decrement (key, value = 1) {
    return false
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  async forever (key, value) {
    return undefined
  }

  /**
   * Remove an item from the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  async forget (key) {
    return true
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  async flush () {
    return undefined
  }

  /**
   * Get the cache key prefix.
   *
   * @return {string}
   */
  getPrefix () {
    return ''
  }
}

module.exports = NullStore
