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
  async reset () {
    for (let name of this._names) {
      await this.resetTag(name)
    }
  }

  /**
   * Get the unique tag identifier for a given tag.
   *
   * @param  {string}  name
   * @return {Promise<string>}
   */
  async tagId (name) {
    const id = await this._store.get(this.tagKey(name))
    return id || this.resetTag(name)
  }

  /**
   * Get an array of tag identifiers for all of the tags in the set.
   *
   * @return {Promise<array>}
   */
  _tagIds () {
    return Promise.all(this._names.map(name => this.tagId(name)))
  }

  /**
   * Get a unique namespace that changes when any of the tags are flushed.
   *
   * @return {Promise<string>}
   */
  async getNamespace () {
    return (await this._tagIds()).join('|')
  }

  /**
   * Reset the tag and return the new tag identifier.
   *
   * @param  {string}  name
   * @return {Promise<string>}
   */
  async resetTag (name) {
    const id = crypto.randomBytes(8).toString('hex')
    await this._store.forever(this.tagKey(name), id)
    return id
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
