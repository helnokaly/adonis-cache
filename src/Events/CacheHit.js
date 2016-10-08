'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class CacheHit {
  /**
   * Create a new event instance.
   *
   * @param  {string}  key    The key that was hit
   * @param  {mixed}   value  The value that was retrieved
   * @param  {array}   tags   The tags that were assigned to the key
   * @returns {void}
   */
  constructor (key, value, tags = []) {
    this.key = key
    this.tags = tags
    this.value = value
  }
}

CacheHit.EVENT = 'Cache.hit'

module.exports = CacheHit
