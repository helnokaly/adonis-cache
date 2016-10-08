'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const co = require('co')

function serialize (data) {
  return JSON.stringify(data)
}

function deserialize (data) {
  return JSON.parse(data)
}

function valueOf (value) {
  return co(function * () {
    if (value == null) {
      return value
    }

    if (typeof value === 'function') {
      value = value()
    }

    if (typeof value === 'object') {
      return yield value
    }

    return value
  })
}

module.exports = {serialize, deserialize, valueOf}
