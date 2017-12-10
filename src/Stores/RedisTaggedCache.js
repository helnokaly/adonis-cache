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

class RedisTaggedCache extends TaggedCache {
  /**
   * Store an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  async put (key, value, minutes = null) {
    await this._pushStandardKeys(await this._tags.getNamespace(), key)
    await super.put(key, value, minutes)
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @return {Promise<void>}
   */
  async forever (key, value) {
    await this._pushForeverKeys(await this._tags.getNamespace(), key)
    await super.forever(key, value)
  }

  /**
   * Remove all items from the cache.
   *
   * @return {Promise<void>}
   */
  async flush () {
    await this._deleteForeverKeys()
    await this._deleteStandardKeys()
    await super.flush()
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
  async _pushKeys (namespace, key, reference) {
    const fullKey = this._store.getPrefix() + crypto.createHash('sha1').update(namespace).digest('hex') + ':' + key
    for (let segment of namespace.split('|')) {
      await this._store.connection().sadd(this._referenceKey(segment, reference), fullKey)
    }
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
  async _deleteKeysByReference (reference) {
    for (let segment of await this._tags.getNamespace()) {
      await this._deleteValues(segment = this._referenceKey(segment, reference))
      await this._store.connection().del(segment)
    }
  }

  /**
   * Delete item keys that have been stored against a reference.
   *
   * @param  {string}  referenceKey
   * @return {Promise<void>}
   *
   * @private
   */
  async _deleteValues (referenceKey) {
    const values = _.uniq(await this._store.connection().smembers(referenceKey))
    for (let i = 0; i < values.length; i++) {
      await this._store.connection().del(values[i])
    }
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
