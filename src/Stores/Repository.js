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

// Events
const CacheHit = require('../Events/CacheHit')
const CacheMissed = require('../Events/CacheMissed')
const KeyForgotten = require('../Events/KeyForgotten')
const KeyWritten = require('../Events/KeyWritten')

class Repository {
  /**
   * Create a new cache repository instance.
   *
   * @param  {Object}  store  The cache store implementation
   * @return {void}
   */
  constructor (store) {
    this._store = store // The cache store implementation
    this._events = null // The event dispatcher implementation

    return new Proxy(this, {
      get: function (target, name) {
        if (target[name] !== undefined) {
          return target[name]
        }
        // Pass missing functions to the store.
        if (typeof target._store[name] === 'function') {
          return target._store[name].bind(target._store)
        }
      }
    })
  }

  /**
   * Set the event dispatcher instance.
   *
   * @param  {Adonis/Src/Event}  events
   * @return {void}
   */
  setEventDispatcher (events) {
    this._events = events
  }

  /**
   * Fire an event for this cache instance.
   *
   * @param  {string}  event
   * @param  {array}  payload
   * @return {void}
   */
  _fireCacheEvent (event, payload) {
    if (this._events == null) {
      return
    }

    switch (event) {
      case 'hit':
        if (payload.length === 2) {
          payload.push([])
        }
        return this._events.fire(CacheHit.EVENT, new CacheHit(payload[0], payload[1], payload[2]))
      case 'missed':
        if (payload.length === 1) {
          payload.push([])
        }
        return this._events.fire(CacheMissed.EVENT, new CacheMissed(payload[0], payload[1]))
      case 'delete':
        if (payload.length === 1) {
          payload.push([])
        }
        return this._events.fire(KeyForgotten.EVENT, new KeyForgotten(payload[0], payload[1]))
      case 'write':
        if (payload.length === 3) {
          payload.push([])
        }
        return this._events.fire(KeyWritten.EVENT, new KeyWritten(payload[0], payload[1], payload[2], payload[3]))
    }
  }

  /**
   * Determine if an item exists in the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  async has (key) {
    return (await this.get(key)) != null
  }

  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string}  key
   * @param  {mixed}   defaultValue
   * @return {Promise<mixed>}
   */
  async get (key, defaultValue = null) {
    let value = await this._store.get(await this._itemKey(key))

    if (value == null) {
      this._fireCacheEvent('missed', [key])

      return Util.valueOf(defaultValue)
    } else {
      this._fireCacheEvent('hit', [key, value])
    }

    return value
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
    const values = await this._store.many(keys)
    for (let key in values) {
      if (values[key] == null) {
        this._fireCacheEvent('missed', [key])
      } else {
        this._fireCacheEvent('hit', [key, values[key]])
      }
    }
    return values
  }

  /**
   * Retrieve an item from the cache and delete it.
   *
   * @param  {string}  key
   * @param  {mixed}   default
   * @return {Promise<mixed>}
   */
  async pull (key, defaultValue = null) {
    const value = await this.get(key, defaultValue)
    await this.forget(key)
    return value
  }

  /**
   * Store an item in the cache.
   *
   * @param  {string}          key
   * @param  {mixed}           value
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  async put (key, value, minutes = null) {
    if (value == null) {
      return
    }

    minutes = this._getMinutes(minutes)

    if (minutes != null) {
      await this._store.put(await this._itemKey(key), value, minutes)
      this._fireCacheEvent('write', [key, value, minutes])
    }
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  values
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  async putMany (values, minutes) {
    minutes = this._getMinutes(minutes)

    if (minutes != null) {
      await this._store.putMany(values, minutes)

      for (let key in values) {
        this._fireCacheEvent('write', [key, values[key], minutes])
      }
    }
  }

  /**
   * Store an item in the cache if the key does not exist.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {DateTime|float|int}  minutes
   * @return {Promise<boolean>}
   */
  async add (key, value, minutes) {
    minutes = this._getMinutes(minutes)

    if (minutes == null) {
      return false
    }

    if (typeof this._store['add'] === 'function') {
      return this._store.add(await this._itemKey(key), value, minutes)
    }

    if ((await this.get(key)) == null) {
      await this.put(key, value, minutes)
      return true
    }

    return false
  }

  /**
   * Increment the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {int}  value
   * @return {Promise<int|boolean>}
   */
  increment (key, value = 1) {
    return this._store.increment(key, value)
  }

  /**
   * Decrement the value of an item in the cache.
   *
   * @param  {string}  key
   * @param  {mixed}  value
   * @return {Promise<int|boolean>}
   */
  decrement (key, value = 1) {
    return this._store.decrement(key, value)
  }

  /**
   * Store an item in the cache indefinitely.
   *
   * @param   {string}  key
   * @param   {mixed}   value
   * @return  {void}
   */
  async forever (key, value) {
    this._store.forever(await this._itemKey(key), value)
    this._fireCacheEvent('write', [key, value, 0])
  }

  /**
   * Get an item from the cache, or store the default value.
   *
   * @param  {string}          key
   * @param  {Date|float|int}  minutes
   * @param  {function}          closure
   * @return {Promise<mixed>}
   */
  async remember (key, minutes, closure) {
    // If the item exists in the cache we will just return this immediately
    // otherwise we will execute the given Closure and cache the result
    // of that execution for the given number of minutes in storage.
    let value = await this.get(key)
    if (value != null) {
      return value
    }

    value = await Util.valueOf(closure)
    await this.put(key, value, minutes)
    return Util.deserialize(Util.serialize(value))
  }

  /**
   * Get an item from the cache, or store the default value forever.
   *
   * @param  {string}          key
   * @param  {function}        closure
   * @return {Promise<mixed>}
   */
  sear (key, closure) {
    return this.rememberForever(key, closure)
  }

  /**
   * Get an item from the cache, or store the default value forever.
   *
   * @param  {string}    key
   * @param  {function}  closure
   * @return {Promise<mixed>}
   */
  async rememberForever (key, closure) {
    // If the item exists in the cache we will just return this immediately
    // otherwise we will execute the given Closure and cache the result
    // of that execution for the given number of minutes. It's easy.
    let value = await this.get(key)
    if (value != null) {
      return value
    }

    value = await Util.valueOf(closure)
    await this.forever(key, value)
    return Util.deserialize(Util.serialize(value))
  }

  /**
   * Remove an item from the cache.
   *
   * @param  {string}  key
   * @return {Promise<boolean>}
   */
  async forget (key) {
    const success = await this._store.forget(await this._itemKey(key))
    this._fireCacheEvent('delete', [key])
    return success
  }

  /**
   * Begin executing a new tags operation if the store supports it.
   *
   * @param  {Array<string>}  names
   * @return {TaggedCache}
   *
   * @throws {BadMethodCallException}
   */
  tags (names) {
    names = Array.isArray(names) ? names : Array.from(arguments)
    if (typeof this._store['tags'] === 'function') {
      const taggedCache = this._store.tags(names)

      if (this._events != null) {
        taggedCache.setEventDispatcher(this._events)
      }

      return taggedCache
    }
    throw new Error('BadMethodCallException: This cache store does not support tagging.')
  }

  /**
   * Format the key for a cache item.
   *
   * @param  {string}  key
   * @return {Promise<string>}
   */
  async _itemKey (key) {
    return key
  }

  /**
   * Get the cache store implementation.
   *
   * @return {Store}
   */
  getStore () {
    return this._store
  }

  /**
   * Calculate the number of minutes with the given duration.
   *
   * @param  {Date|float|int}  duration
   * @return {float|int|null}
   */
  _getMinutes (duration) {
    if (duration instanceof Date) {
      duration = ((duration.getTime() - Date.now()) / 1000) / 60
    }

    return (duration * 60) > 0 ? duration : null
  }
}

module.exports = Repository
