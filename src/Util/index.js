'use strict'

/**
 * adonis-cache
 *
 * (c) Hany El Nokaly <hany.elnokaly@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

function serialize (data) {
  return JSON.stringify(data)
}

function deserialize (data) {
  return JSON.parse(data)
}

async function valueOf (value) {
  if (typeof value === 'function') {
    value = value()
  }

  return value
}

/**
 * Returns integer number between two numbers (inclusive)
 * 
 * @param {int} min 
 * @param {int} max 
 * @return int
 */
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = {serialize, deserialize, valueOf, randomIntBetween}
