'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const crypto = require('crypto')
const co = require('co')

class TagSet {

  /**
   * Create a new TagSet instance.
   *
   * @param  {Store}  store  The cache store implementation
   * @param  {array}  names  The tag names
   * @return {TagSet}
   */
  constructor (store, names = []) {
    this._store = store
    this._names = names
  }

  /**
   * Reset all tags in the set.
   *
   * @return {Promise<void>}
   */
  reset () {
    return co(function * () {
      for (let name of this._names) {
        yield this.resetTag(name)
      }
    }.bind(this))
  }

  /**
   * Get the unique tag identifier for a given tag.
   *
   * @param  {string}  name
   * @return {Promise<string>}
   */
  tagId (name) {
    return co(function * () {
      const id = yield this._store.get(this.tagKey(name))
      return id ? id : yield this.resetTag(name)
    }.bind(this))
  }

  /**
   * Get an array of tag identifiers for all of the tags in the set.
   *
   * @return {Promise<array>}
   */
  _tagIds () {
    return co(function * () {
      const names = this._names.map(name => this.tagId(name))
      return yield names
    }.bind(this))
  }

  /**
   * Get a unique namespace that changes when any of the tags are flushed.
   *
   * @return {Promise<string>}
   */
  getNamespace () {
    return co(function * () {
      return (yield this._tagIds()).join('|')
    }.bind(this))
  }

  /**
   * Reset the tag and return the new tag identifier.
   *
   * @param  {string}  name
   * @return {Promise<string>}
   */
  resetTag (name) {
    return co(function * () {
      const id = crypto.randomBytes(8).toString('hex')
      yield this._store.forever(this.tagKey(name), id)
      return id
    }.bind(this))
  }

  /**
   * Get the tag identifier key for a given tag.
   *
   * @param  {string}  name
   * @return {string}
   */
  tagKey (name) {
    return 'tag:' + name + ':key'
  }

  /**
   * Get all of the tag names in the set.
   *
   * @return {array}
   */
  getNames () {
    return this._names
  }
}

module.exports = TagSet
