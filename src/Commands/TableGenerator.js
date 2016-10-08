'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const BaseGenerator = require('../../../adonis-commands/src/Generators/Base')
const path = require('path')

class TableGenerator extends BaseGenerator {

  /**
   * makes path to a given template
   * @param  {String} template
   * @return {String}
   *
   * @private
   */
  _makeTemplatePath (template) {
    return path.join(__dirname, '../../templates', `${template}.mustache`)
  }

  /**
   * returns signature to be used by ace
   * @return {String}
   *
   * @public
   */
  get signature () {
    return `cache:table`
  }

  /**
   * returns description to be used by ace as help command
   * @return {String}
   *
   * @public
   */
  get description () {
    return 'Create a migration for the cache database table'
  }

  /**
   * called by ace automatically. It will create a new
   * migrations file inside the migrations directory.
   * @param  {Object} args
   * @param  {Object} options
   *
   * @public
   */
  * handle (args, options) {
    const name = 'create_cache_table'
    const toPath = this.helpers.migrationsPath(`${new Date().getTime()}_${name}.js`)
    const template = 'table'
    const templateOptions = {}

    yield this._wrapWrite(template, toPath, templateOptions)
  }
}

module.exports = TableGenerator
