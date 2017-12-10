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
    it('Should put key in cache and return void (value is string)', async () => {
      expect(await Store.put('name', name, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is integer)', async () => {
      expect(await Store.put('age', age, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is float)', async () => {
      expect(await Store.put('height', height, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is plain object)', async () => {
      expect(await Store.put('person', person, 1)).to.equal(undefined)
    })
    it('Should put key in cache and return void (value is array)', async () => {
      expect(await Store.put('array', array, 1)).to.equal(undefined)
    })
  })

  describe('get', function () {
    it('Should get cached value (value is string)', async () => {
      expect(await Store.get('name')).to.equal(name)
    })
    it('Should get cached value (value is integer)', async () => {
      expect(await Store.get('age')).to.equal(age)
    })
    it('Should get cached value (value is float)', async () => {
      expect(await Store.get('height')).to.equal(height)
    })
    it('Should get cached value (value is plain object)', async () => {
      expect(await Store.get('person')).to.deep.equal(person)
    })
    it('Should get cached value (value is array)', async () => {
      expect(await Store.get('array')).to.deep.equal(array)
    })
    it('Should return null for a key that is not cached', async () => {
      expect(await Store.get('unknown')).to.equal(null)
    })
  })

  describe('many', function () {
    it('Should get many cached value at once', async () => {
      expect(await Store.many(['name', 'age', 'height'])).to.deep.equal({name, age, height})
    })
  })

  describe('flush', function () {
    it('Should flush cached data and return void', async () => {
      expect(await Store.flush()).to.equal(undefined)
    })
    it('Should get null for cached data after flushing', async () => {
      expect(await Store.get('name')).to.equal(null)
    })
    it('Should get null for cached data after flushing', async () => {
      expect(await Store.get('age')).to.equal(null)
    })
    it('Should get null for cached data after flushing', async () => {
      expect(await Store.get('height')).to.equal(null)
    })
  })

  describe('putMany', function () {
    it('Should put many key:value pairs in cache and return void', async () => {
      expect(await Store.putMany(person, 1)).to.equal(undefined)
    })
    it('Should get cached value added through putMany', async () => {
      expect(await Store.get('name')).to.equal(name)
    })
    it('Should get cached value added through putMany', async () => {
      expect(await Store.get('age')).to.equal(age)
    })
    it('Should get cached value added through putMany', async () => {
      expect(await Store.get('height')).to.equal(height)
    })
  })

  describe('forget', function () {
    it('Should forget a key and return true', async () => {
      expect(await Store.forget('name')).to.equal(true)
    })
    it('Should get get null for forgotten key', async () => {
      expect(await Store.get('name')).to.equal(null)
    })
  })

  describe('increment', function () {
    it('Should increment age and return incremented value', async () => {
      expect((await Store.increment('age'))).to.equal(27)
    })
    it('Should return false for unincrementable value', async () => {
      expect(await Store.increment('tags')).to.equal(false)
    })
  })

  describe('decrement', function () {
    it('Should decrement age and return incremented value', async () => {
      expect((await Store.decrement('age', 7))).to.equal(20)
    })
    it('Should return false for undecrementable value', async () => {
      expect(await Store.increment('tags')).to.equal(false)
    })
  })

  describe('expiration', function () {
    it('Should put a new key to test expiration', async () => {
      await Store.put('framework', 'adonis', 1)
      expect(await Store.get('framework')).to.equal('adonis')
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
