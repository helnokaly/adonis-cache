'use strict'

const chai = require('chai')
const expect = chai.expect

const Store = new (require('../src/Stores/ObjectStore'))()

describe('Object Store', function () {
  const name = 'David'
  const age = 26
  const height = 170.5
  const person = {
    name: 'David',
    age: 26,
    height: 170.5,
    tags: ['smart', 'ambitious']
  }
  const array = ['string', 1, 2.0, {}]

  describe('put', function () {
    it('Should put key in cache and return void (value is string)', function * () {
      expect(yield Store.put('name', name, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is integer)', function * () {
      expect(yield Store.put('age', age, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is float)', function * () {
      expect(yield Store.put('height', height, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is plain object)', function * () {
      expect(yield Store.put('person', person, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is array)', function * () {
      expect(yield Store.put('array', array, 1)).to.equal(undefined)
    })
  })

  describe('get', function () {
    it('Should get cached value (value is string)', function * () {
      expect(yield Store.get('name')).to.equal(name)
    })
    it('Should get cached value (value is integer)', function * () {
      expect(yield Store.get('age')).to.equal(age)
    })
    it('Should get cached value (value is float)', function * () {
      expect(yield Store.get('height')).to.equal(height)
    })
    it('Should get cached value (value is plain object)', function * () {
      expect(yield Store.get('person')).to.deep.equal(person)
    })
    it('Should get cached value (value is array)', function * () {
      expect(yield Store.get('array')).to.deep.equal(array)
    })
    it('Should return null for a key that is not cached', function * () {
      expect(yield Store.get('unknown')).to.equal(null)
    })
  })

  describe('many', function () {
    it('Should get many cached value at once', function * () {
      expect(yield Store.many(['name', 'age', 'height'])).to.deep.equal({name, age, height})
    })
  })

  describe('flush', function () {
    it('Should flush cached data and return void', function * () {
      expect(yield Store.flush()).to.equal(undefined)
    })
    it('Should get null for cached data after flushing', function * () {
      expect(yield Store.get('name')).to.equal(null)
    })
    it('Should get null for cached data after flushing', function * () {
      expect(yield Store.get('age')).to.equal(null)
    })
    it('Should get null for cached data after flushing', function * () {
      expect(yield Store.get('height')).to.equal(null)
    })
  })

  describe('putMany', function () {
    it('Should put many key:value pairs in cache and return void', function * () {
      expect(yield Store.putMany(person, 1)).to.equal(undefined)
    })
    it('Should get cached value added through putMany', function * () {
      expect(yield Store.get('name')).to.equal(name)
    })
    it('Should get cached value added through putMany', function * () {
      expect(yield Store.get('age')).to.equal(age)
    })
    it('Should get cached value added through putMany', function * () {
      expect(yield Store.get('height')).to.equal(height)
    })
  })

  describe('forget', function () {
    it('Should forget a key and return true', function * () {
      expect(yield Store.forget('name')).to.equal(true)
    })
    it('Should get get null for forgotten key', function * () {
      expect(yield Store.get('name')).to.equal(null)
    })
  })

  describe('increment', function () {
    it('Should increment age and return incremented value', function * () {
      expect((yield Store.increment('age')) == 27).to.equal(true)
    })
    it('Should return false for unincrementable value', function * () {
      expect(yield Store.increment('tags')).to.equal(false)
    })
  })

  describe('decrement', function () {
    it('Should decrement age and return incremented value', function * () {
      expect((yield Store.decrement('age', 7)) == 20).to.equal(true)
    })
    it('Should return false for undecrementable value', function * () {
      expect(yield Store.increment('tags')).to.equal(false)
    })
  })

  describe('expiration', function () {
    it('Should put a new key to test expiration', function * () {
      yield Store.put('framework', 'adonis', 1)
      expect(yield Store.get('framework')).to.equal('adonis')
    })

    it('Should not be able to get key value after 1 minute', function (done) {
      this.timeout(1 * 60 * 1000 + 5000)
      setTimeout(function () {
        Store.get('framework')
          .then(r => expect(r).to.equal(null))
          .then(r => done())
          .catch(error => done(error))
      }, 1 * 60 * 1000)
    })

    it('Should not be able to get an expired key (0 minutes)', function (done) {
      Store.put('year', 2016)
        .then(r => {
          setTimeout(function () {
            Store.get('year')
              .then(r2 => expect(r2).to.equal(null))
              .then(_ => done())
              .catch(error => done(error))
          }, 1 * 1000)
        })
    })
  })
})
