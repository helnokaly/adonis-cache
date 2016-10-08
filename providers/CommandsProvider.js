'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class CommandsProvider extends ServiceProvider {

  * register () {
    this.app.bind(`Adonis/Commands/Cache:Table`, (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Generator = require(`../src/Commands/TableGenerator`)
      return new Generator(Helpers)
    })

    this.app.bind(`Adonis/Commands/Cache:Config`, (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Generator = require(`../src/Commands/ConfigGenerator`)
      return new Generator(Helpers)
    })
  }
}

module.exports = CommandsProvider
