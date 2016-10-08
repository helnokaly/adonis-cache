'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const crypto = require('crypto')
const co = require('co')
const Repository = require('./Repository')

class TaggedCache extends Repository {

  /**
   * Create a new tagged cache instance.
   *
   * @param  {Store}   store
   * @param  {TagSet}  tags   The tag set instance
   * @return {void}
   */
  constructor (store, tags) {
    super(store)
    this._tags = tags
  }

  /**
   * {@inheritdoc}
   */
  _fireCacheEvent (event, payload) {
    payload.push(this._tags.getNames())
    super._fireCacheEvent(event, payload)
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promsie<void>}
   */
  increment (key, value = 1) {
    return co(function * () {
      return yield this._store.increment(yield this._itemKey(key), value)
    }.bind(this))
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  decrement (key, value = 1) {
    return co(function * () {
      return yield this._store.decrement(yield this._itemKey(key), value)
    }.bind(this))
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  flush () {
    return this._tags.reset()
  }

  /**
   * {@inheritdoc}
   */
  _itemKey (key) {
    return this.taggedItemKey(key)
  }

  /**
   * Get a fully qualified key for a tagged item.
   *
   * @param  {string}  key
   * @return {Promise<string>}
   */
  taggedItemKey (key) {
    return co(function * () {
      return crypto.createHash('sha1').update(yield this._tags.getNamespace()).digest('hex') + ':' + key
    }.bind(this))
  }
}

module.exports = TaggedCache
