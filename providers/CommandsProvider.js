'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
  /**
   * Register all the required providers
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.bind('Adonis/Commands/Cache:Config', () => require('../commands/ConfigGenerator'))
    this.app.bind('Adonis/Commands/Cache:Table', () => require('../commands/TableGenerator'))
  }

  /**
   * On boot
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    /**
     * Register command with ace.
     */
    const ace = require('@adonisjs/ace')
    ace.addCommand('Adonis/Commands/Cache:Config')
    ace.addCommand('Adonis/Commands/Cache:Table')
  }
}

module.exports = CommandsProvider
