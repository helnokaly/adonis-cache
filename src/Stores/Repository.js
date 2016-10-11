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
  has (key) {
    return co(function * () {
      return (yield this.get(key)) != null
    }.bind(this))
  }

  /**
   * Retrieve an item from the cache by key.
   *
   * @param  {string}  key
   * @param  {mixed}   defaultValue
   * @return {Promise<mixed>}
   */
  get (key, defaultValue = null) {
    return co(function * () {
      let value = yield this._store.get(yield this._itemKey(key))

      if (value == null) {
        this._fireCacheEvent('missed', [key])

        return yield Util.valueOf(defaultValue)
      } else {
        this._fireCacheEvent('hit', [key, value])
      }

      return value
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
      const values = yield this._store.many(keys)
      for (let key in values) {
        if (values[key] == null) {
          this._fireCacheEvent('missed', [key])
        } else {
          this._fireCacheEvent('hit', [key, values[key]])
        }
      }
      return values
    }.bind(this))
  }

  /**
   * Retrieve an item from the cache and delete it.
   *
   * @param  {string}  key
   * @param  {mixed}   default
   * @return {Promise<mixed>}
   */
  pull (key, defaultValue = null) {
    return co(function * () {
      const value = yield this.get(key, defaultValue)
      yield this.forget(key)
      return value
    }.bind(this))
  }

  /**
   * Store an item in the cache.
   *
   * @param  {string}          key
   * @param  {mixed}           value
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  put (key, value, minutes = null) {
    return co(function * () {
      if (value == null) {
        return
      }

      minutes = this._getMinutes(minutes)

      if (minutes != null) {
        yield this._store.put(yield this._itemKey(key), value, minutes)
        this._fireCacheEvent('write', [key, value, minutes])
      }
    }.bind(this))
  }

  /**
   * Store multiple items in the cache for a given number of minutes.
   *
   * @param  {object}  values
   * @param  {Date|float|int}  minutes
   * @return {Promise<void>}
   */
  putMany (values, minutes) {
    return co(function * () {
      minutes = this._getMinutes(minutes)

      if (minutes != null) {
        yield this._store.putMany(values, minutes)

        for (let key in values) {
          this._fireCacheEvent('write', [key, values[key], minutes])
        }
      }
    }.bind(this))
  }

  /**
   * Store an item in the cache if the key does not exist.
   *
   * @param  {string}  key
   * @param  {mixed}   value
   * @param  {DateTime|float|int}  minutes
   * @return {Promise<boolean>}
   */
  add (key, value, minutes) {
    return co(function * () {
      minutes = this._getMinutes(minutes)

      if (minutes == null) {
        return false
      }

      if (typeof this._store['add'] === 'function') {
        return yield this._store.add(yield this._itemKey(key), value, minutes)
      }

      if ((yield this.get(key)) == null) {
        yield this.put(key, value, minutes)
        return true
      }

      return false
    }.bind(this))
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
  forever (key, value) {
    return co(function * () {
      this._store.forever(yield this._itemKey(key), value)
      this._fireCacheEvent('write', [key, value, 0])
    }.bind(this))
  }

  /**
   * Get an item from the cache, or store the default value.
   *
   * @param  {string}          key
   * @param  {Date|float|int}  minutes
   * @param  {function}          closure
   * @return {Promise<mixed>}
   */
  remember (key, minutes, closure) {
      // If the item exists in the cache we will just return this immediately
      // otherwise we will execute the given Closure and cache the result
      // of that execution for the given number of minutes in storage.
    return co(function * () {
      let value = yield this.get(key)
      if (value != null) {
        return value
      }

      value = yield Util.valueOf(closure)
      yield this.put(key, value, minutes)
      return value
    }.bind(this))
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
  rememberForever (key, closure) {
    // If the item exists in the cache we will just return this immediately
    // otherwise we will execute the given Closure and cache the result
    // of that execution for the given number of minutes. It's easy.
    return co(function * () {
      let value = yield this.get(key)
      if (value != null) {
        return value
      }

      value = yield Util.valueOf(closure)
      yield this.forever(key, value)
      return value
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
      const success = yield this._store.forget(yield this._itemKey(key))
      this._fireCacheEvent('delete', [key])
      return success
    }.bind(this))
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
  _itemKey (key) {
    return co(function * () {
      return key
    })
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

    return Math.floor((duration * 60) > 0 ? duration : null)
  }

}

module.exports = Repository
