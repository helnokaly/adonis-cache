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
 * Command to generate a cache config file
 *
 * @class ConfigGenerator
 * @constructor
 */
class ConfigGenerator extends Command {
  constructor (Helpers) {
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
  static get inject () {
    return ['Adonis/Src/Helpers']
  }

  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return 'cache:config'
  }

  /**
   * The command description
   *
   * @method description
   *
   * @return {String}
   */
  static get description () {
    return 'Generate cache config file'
  }

  /**
   * Method called when command is executed
   *
   * @method handle
   *
   * @param {Object} options
   * @return {void}
   */
  async handle (options) {
    /**
     * Reading template as a string form the mustache file
     */
    const template = await this.readFile(path.join(__dirname, './templates/config.mustache'), 'utf8')

    /**
     * Directory paths
     */
    const relativePath = path.join('config', 'cache.js')
    const configPath = path.join(this.Helpers.appRoot(), relativePath)

    /**
     * If command is not executed via command line, then return
     * the response
     */
    if (!this.viaAce) {
      return this.generateFile(configPath, template, {})
    }

    /**
     * Otherwise wrap in try/catch and show appropriate messages
     * to the end user.
     */
    try {
      await this.generateFile(configPath, template, {})
      this.completed('create', relativePath)
    } catch (error) {
      this.error(`${relativePath} cache config file already exists`)
    }
  }
}

module.exports = ConfigGenerator
