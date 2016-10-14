'use strict'

const chai = require('chai')
const expect = chai.expect

const Store = new (require('../src/Stores/NullStore'))()

describe('Null Store', function () {
  describe('put', function () {
    it('Should return undefined', function * () {
      expect(yield Store.put('key', 'value', 1)).to.equal(undefined)
    })
  })

  describe('get', function () {
    it('Should return null', function * () {
      expect(yield Store.get('key')).to.equal(null)
    })
  })

  describe('flush', function () {
    it('Should return undefined', function * () {
      expect(yield Store.flush()).to.equal(undefined)
    })
  })

  describe('putMany', function () {
    it('Should return undefined', function * () {
      expect(yield Store.putMany({key1: 'value1', key2: 'value2'}, 1)).to.equal(undefined)
    })
  })

  describe('many', function () {
    it('Should return cached values as null', function * () {
      expect(yield Store.many(['key1', 'key2'])).to.deep.equal({key1: null, key2: null})
    })
  })

  describe('forget', function () {
    it('Should return true', function * () {
      expect(yield Store.forget('name')).to.equal(true)
    })
  })

  describe('increment', function () {
    it('Should return false', function * () {
      expect(yield Store.increment('key')).to.equal(false)
    })
  })

  describe('decrement', function () {
    it('Should return false', function * () {
      expect(yield Store.decrement('age')).to.equal(false)
    })
  })
})
