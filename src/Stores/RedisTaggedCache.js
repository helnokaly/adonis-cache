'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const TaggedCache = require('./TaggedCache')
const crypto = require('crypto')
const _ = require('lodash')
const co = require('co')

class RedisTaggedCache extends TaggedCache {

  /**
   * Store an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  put (key, value, minutes = null) {
    // return co(function * () {
    //   yield this._pushStandardKeys(yield this._tags.getNamespace(), key)
    //   yield super.put(key, value, minutes)
    // }.bind(this))
    return new Promise((resolve, reject) => {
      this._tags.getNamespace()
        .then(namespace => this._pushStandardKeys(namespace, key))
        .then(r => super.put(key, value, minutes))
        .then(r => resolve())
        .catch(e => reject(e))
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
    // return co(function * () {
    //   yield this._pushForeverKeys(yield this._tags.getNamespace(), key)
    //   yield super.forever(key, value)
    // }.bind(this))
    return new Promise((resolve, reject) => {
      this._tags.getNamespace()
        .then(namespace => this._pushForeverKeys(namespace, key))
        .then(r => super.forever(key, value))
        .then(r => resolve())
        .catch(e => reject(e))
    })
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  flush () {
    // return co(function * () {
    //   yield this._deleteForeverKeys()
    //   yield this._deleteStandardKeys()
    //   yield super.flush()
    // }.bind(this))
    return new Promise((resolve, reject) => {
      this._deleteForeverKeys()
        .then(r => this._deleteStandardKeys())
        .then(r => super.flush())
        .then(r => resolve())
        .catch(e => reject(e))
    })
  }

  /**
   * Store standard key references into store.
   *
   * @param  {string}  namespace
   * @param  {string}  key
   * @return {Promise<void>}
   *
   * @private
   */
  _pushStandardKeys (namespace, key) {
    return this._pushKeys(namespace, key, RedisTaggedCache.REFERENCE_KEY_STANDARD)
  }

  /**
   * Store forever key references into store.
   *
   * @param  {string}  namespace
   * @param  {string}  key
   * @return {Promise<void>}
   *
   * @private
   */
  _pushForeverKeys (namespace, key) {
    return this._pushKeys(namespace, key, RedisTaggedCache.REFERENCE_KEY_FOREVER)
  }

  /**
   * Store a reference to the cache key against the reference key.
   *
   * @param  {string}  namespace
   * @param  {string}  key
   * @param  {string}  reference
   * @return {Promise<void>}
   *
   * @private
   */
  _pushKeys (namespace, key, reference) {
    return co(function * () {
      const fullKey = this._store.getPrefix() + crypto.createHash('sha1').update(namespace).digest('hex') + ':' + key
      for (let segment of namespace.split('|')) {
        yield this._store.connection().sadd(this._referenceKey(segment, reference), fullKey)
      }
    }.bind(this))
  }

  /**
   * Delete all of the items that were stored forever.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  _deleteForeverKeys () {
    return this._deleteKeysByReference(RedisTaggedCache.REFERENCE_KEY_FOREVER)
  }

  /**
   * Delete all standard items.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  _deleteStandardKeys () {
    return this._deleteKeysByReference(RedisTaggedCache.REFERENCE_KEY_STANDARD)
  }

  /**
   * Find and delete all of the items that were stored against a reference.
   *
   * @param  {string}  reference
   * @return {Promise<void>}
   *
   * @private
   */
  _deleteKeysByReference (reference) {
    return co(function * () {
      for (let segment of yield this._tags.getNamespace()) {
        yield this._deleteValues(segment = this._referenceKey(segment, reference))
        yield this._store.connection().del(segment)
      }
    }.bind(this))
  }

  /**
   * Delete item keys that have been stored against a reference.
   *
   * @param  {string}  referenceKey
   * @return {Promise<void>}
   *
   * @private
   */
  _deleteValues (referenceKey) {
    return co(function * () {
      const values = _.uniq(yield this._store.connection().smembers(referenceKey))
      for (let i = 0; i < values.length; i++) {
        yield this._store.connection().del(values[i])
      }
    }.bind(this))
  }

  /**
   * Get the reference key for the segment.
   *
   * @param  {string}  segment
   * @param  {string}  suffix
   * @return {string}
   *
   * @private
   */
  _referenceKey (segment, suffix) {
    return this._store.getPrefix() + segment + ':' + suffix
  }
}

/**
   * Forever reference key.
   *
   * @var string
   */
RedisTaggedCache.REFERENCE_KEY_FOREVER = 'forever_ref'

  /**
   * Standard reference key.
   *
   * @var string
   */
RedisTaggedCache.REFERENCE_KEY_STANDARD = 'standard_ref'

module.exports = RedisTaggedCache
