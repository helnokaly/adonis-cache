'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ObjectStore = require('./ObjectStore')
const RedisStore = require('./RedisStore')
const NullStore = require('./NullStore')
const DatabaseStore = require('./DatabaseStore')
const Repository = require('./Repository')

class CacheManager {
  constructor (app) {
    this._app = app // The application instance
    this._stores = [] // The array of resolved cache stores
    this._customCreators = [] // The registered custom driver creators

    return new Proxy(this, {
      get: function (target, name) {
        if (target[name] !== undefined) {
          return target[name]
        }
        // Dynamically call the default driver instance
        const store = target.store()
        if (typeof store[name] === 'function') {
          return store[name].bind(store)
        }
      }
    })
  }

  /**
   * Get a cache store instance by name.
   *
   * @param  {string|null}  name
   * @return {mixed}
   */
  store (name = null) {
    name = name || this.getDefaultDriver()
    this._stores[name] = this._get(name)
    return this._stores[name]
  }

  /**
   * Get a cache driver instance.
   *
   * @param  {string}  driver
   * @return {mixed}
   */
  driver (driver = null) {
    return this._store(driver)
  }

  /**
   * Attempt to get the store from the local cache.
   *
   * @param  {string}  name
   * @return {Repository}
   * @private
   */
  _get (name) {
    return this._stores[name] != null ? this._stores[name] : this._resolve(name)
  }

  /**
   * Resolve the given store.
   *
   * @param  {string}  name
   * @return {Repository}
   *
   * @throws {InvalidArgumentException}
   * @private
   */
  _resolve (name) {
    const config = this._getConfig(name)

    if (config == null) {
      throw new Error(`InvalidArgumentException: Cache store [${name}] is not defined.`)
    }

    if (this._customCreators[config['driver']] != null) {
      return this._callCustomCreator(config)
    } else {
      const driveName = config['driver'].charAt(0).toUpperCase() + config['driver'].substr(1).toLowerCase()
      const driverMethod = '_create' + driveName + 'Driver'

      if (typeof this[driverMethod] === 'function') {
        return this[driverMethod](config)
      } else {
        throw new Error(`InvalidArgumentException: Driver [${config['driver']}] is not supported.`)
      }
    }
  }

  /**
   * Call a custom driver creator.
   *
   * @param  {object}  config
   * @return {mixed}
   * @private
   */
  _callCustomCreator (config) {
    return this._customCreators[config['driver']](this._app, config)
  }

  /**
   * Create an instance of the Null cache driver.
   *
   * @return {Repository}
   * @private
   */
  _createNullDriver () {
    return this.repository(new NullStore())
  }

  /**
   * Create an instance of the object cache driver.
   *
   * @return {Repository}
   * @private
   */
  _createObjectDriver () {
    return this.repository(new ObjectStore())
  }

  /**
   * Create an instance of the Redis cache driver.
   *
   * @param  {object}  config
   * @return {Repository}
   * @private
   */
  _createRedisDriver (config) {
    const redis = this._app.use('Adonis/Addons/Redis')
    const connection = config['connection'] ? config['connection'] : 'local'
    return this.repository(new RedisStore(redis, this._getPrefix(config), connection))
  }

  /**
   * Create an instance of the database cache driver.
   *
   * @param  {object}  config
   * @return {Repository}
   * @private
   */
  _createDatabaseDriver (config) {
    const connection = this._app.use('Adonis/Src/Database').connection(config['connection'])

    return this.repository(new DatabaseStore(connection, config['table'], this._getPrefix(config)))
  }

  /**
   * Create a new cache repository with the given implementation.
   *
   * @param  {Store}  store
   * @return {Repository}
   */
  repository (store) {
    const repository = new Repository(store)

    const Event = this._app.use('Adonis/Src/Event')
    if (Event != null) {
      repository.setEventDispatcher(Event)
    }

    return repository
  }

  /**
   * Get the cache prefix.
   *
   * @param  {object}  config
   * @return {string}
   * @private
   */
  _getPrefix (config) {
    return config['prefix'] ? config['prefix'] : this._app.use('Adonis/Src/Config').get('cache.prefix')
  }

  /**
   * Get the cache connection configuration.
   *
   * @param  {string}  name
   * @return {object}
   * @private
   */
  _getConfig (name) {
    return this._app.use('Adonis/Src/Config').get(`cache.stores.${name}`)
  }

  /**
   * Get the default cache driver name.
   *
   * @return {string}
   */
  getDefaultDriver () {
    return this._app.use('Adonis/Src/Config').get('cache.default')
  }

  /**
   * Set the default cache driver name.
   *
   * @param  {string}  name
   * @return {void}
   */
  setDefaultDriver (name) {
    // this._app.use('Adonis/Src/Config').get('cache.default') = name
  }

  /**
   * Register a custom driver creator Closure.
   *
   * @param  {string}    driver
   * @param  {function}  closure
   * @return {this}
   */
  extend (driver, closure) {
    // this._customCreators[driver] = closure.bindTo(this, this)
    this._customCreators[driver] = closure.bind(this)
    return this
  }
}

module.exports = CacheManager
