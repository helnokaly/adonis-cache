'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class CacheMissed {
  /**
   * Create a new event instance.
   *
   * @param  {string}  key   The key that was missed
   * @param  {array}   tags  The tags that were assigned to the key
   * @returns {void}
   */
  constructor (key, tags = []) {
    this.key = key
    this.tags = tags
  }
}

CacheMissed.EVENT = 'Cache.missed'

module.exports = CacheMissed
