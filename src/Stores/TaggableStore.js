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
const TagSet = require('./TagSet')

// Abstract
class TaggableStore {
  /**
   * Begin executing a new tags operation.
   *
   * @param  {array|mixed}  names
   * @return {TaggedCache}
   */
  tags (names) {
    names = Array.isArray(names) ? names : Array.from(arguments)
    return new TaggedCache(this, new TagSet(this, names))
  }
}

module.exports = TaggableStore
