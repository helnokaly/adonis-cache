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
    return `cache:config`
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
   * config file inside the config directory.
   * @param  {Object} args
   * @param  {Object} options
   *
   * @public
   */
  * handle (args, options) {
    const toPath = this.helpers.configPath(`cache.js`)
    const template = 'config'
    const templateOptions = {}

    yield this._wrapWrite(template, toPath, templateOptions)
  }
}

module.exports = TableGenerator
