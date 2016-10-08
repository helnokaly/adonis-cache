'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class KeyWritten {
  /**
   * Create a new event instance.
   *
   * @param    {string}  key The key that was written
   * @param    {mixed}   value The value that was written
   * @param    {int}     minutes The number of minutes the key should be valid
   * @param    {array}   tags The tags that were assigned to the key
   * @returns  {void}
   */
  constructor (key, value, minutes, tags = []) {
    this.key = key
    this.tags = tags
    this.value = value
    this.minutes = minutes
  }
}

KeyWritten.EVENT = 'Cache.keyWritten'

module.exports = KeyWritten
