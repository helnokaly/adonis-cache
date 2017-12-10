'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const { Command } = require('@adonisjs/ace')

/**
 * Command to generate a migration for the cache database table
 *
 * @class TableGenerator
 * @constructor
 */
class TableGenerator extends Command {
  constructor(Helpers) {
    super()
    this.Helpers = Helpers
  }

  /**
   * IoC container injections
   *
   * @method inject
   *
   * @return {Array}
   */
  static get inject() {
    return ['Adonis/Src/Helpers']
  }

  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature() {
    return 'cache:table'
  }

  /**
   * The command description
   *
   * @method description
   *
   * @return {String}
   */
  static get description() {
    return 'Generate a migration for the cache database table'
  }

  /**
   * Method called when command is executed
   *
   * @method handle
   *
   * @param {Object} options
   * @return {void}
   */
  async handle(options) {
    /**
     * Reading template as a string form the mustache file
     */
    const template = await this.readFile(path.join(__dirname, './templates/table.mustache'), 'utf8')

    /**
     * Directory paths
     */
    const relativePath = path.join('database/migrations', `${new Date().getTime()}_create_cache_table.js`)
    const fullPath = path.join(this.Helpers.appRoot(), relativePath)

    /**
     * If command is not executed via command line, then return
     * the response
     */
    if (!this.viaAce) {
      return this.generateFile(fullPath, template, {})
    }

    /**
     * Otherwise wrap in try/catch and show appropriate messages
     * to the end user.
     */
    try {
      await this.generateFile(fullPath, template, {})
      this.completed('create', relativePath)
    } catch (error) {
      this.error(`${relativePath} file already exists`)
    }
  }
}

module.exports = TableGenerator
