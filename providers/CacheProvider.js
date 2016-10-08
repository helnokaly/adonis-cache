'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ServiceProvider = require('adonis-fold').ServiceProvider
const CacheManager = require('../src/Stores/CacheManager')

class CacheProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Addons/Cache', function (app) {
      return new CacheManager(app)
    })
  }
}

module.exports = CacheProvider
