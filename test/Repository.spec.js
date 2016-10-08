'use strict'

const chai = require('chai')
const expect = chai.expect

var Redis = require('ioredis')
var redis = new Redis()

var redisStub = {
  connection: () => redis
}

const Store = new (require('../src/Stores/RedisStore'))(redisStub)
const Repository = new (require('../src/Stores/Repository'))(Store)
Repository.setEventDispatcher({
  fire: function (event, model) {
    // console.log(event, '\n', model)
  }
})

describe('Repository', function () {
  describe('flush', function () {
    it('should flush store and return undefined', function () {
      return Repository.flush()
        .then(r => expect(r).to.equal(undefined))
    })
  })

  describe('has', function () {
    it('should return false for a key that is not in the cache', function () {
      return Repository.has('ruby')
        .then(r => expect(r).to.equal(false))
    })

    it('should return true for a key that is in the cache', function () {
      return Repository.put('ruby', 'rails', 1)
        .then(r => expect(r).to.equal(undefined))
        .then(r => Repository.has('ruby'))
        .then(r => expect(r).to.equal(true))
    })
  })

  describe('pull', function () {
    it('should pull a value of existing key in the cache', function () {
      return Repository.pull('ruby')
        .then(r => expect(r).to.equal('rails'))
    })

    it('should return a null for a key that was pulled', function () {
      return Repository.pull('ruby')
        .then(r => expect(r).to.equal(null))
    })

    it('should return default value for a key that does not exist', function () {
      return Repository.pull('ruby', 'gems')
        .then(r => expect(r).to.equal('gems'))
    })
  })

  describe('get', function () {
    it('should get a value of existing key in the cache', function () {
      return Repository.put('name', 'david', 1)
        .then(r => expect(r).to.equal(undefined))
        .then(r => Repository.get('name'))
        .then(r => expect(r).to.equal('david'))
    })

    it('should return a null for a key that was pulled', function () {
      return Repository.get('age')
        .then(r => expect(r).to.equal(null))
    })

    it('should return default value for a key that does not exist', function () {
      return Repository.get('country', 'usa')
        .then(r => expect(r).to.equal('usa'))
    })
  })

  describe('add', function () {
    it('should return false when adding key that is in the cache and should not change value of existing one', function () {
      return Repository.add('name', 'john', 1)
        .then(r => expect(r).to.equal(false))
        .then(r => Repository.get('name'))
        .then(r => expect(r).to.equal('david'))
    })

    it('should return a false when adding a key with 0 minutes expiration and should not change value of existing one', function () {
      return Repository.add('name', 'john', 0)
        .then(r => expect(r).to.equal(false))
        .then(r => Repository.get('name'))
        .then(r => expect(r).to.equal('david'))
    })

    it('should return true when adding key that is not in the cache and should add it', function () {
      return Repository.add('state', 'california', 1)
        .then(r => expect(r).to.equal(true))
        .then(r => Repository.get('state'))
        .then(r => expect(r).to.equal('california'))
    })
  })

  describe('remember', function () {
    it('should return generator function value and cache its value for a key that is not in the cache', function () {
      return Repository.put('firstname', 'david', 1)
        .then(r => Repository.put('lastname', 'king'))
        .then(r => Repository.remember('test', 1, function * () {
          const temp = yield Repository.get('firstname')
          const temp2 = yield Repository.get('lastname')
          return temp + ' ' + temp2
        }))
        .then(r => expect(r).to.equal('david king'))
        .then(r => Repository.get('test'))
        .then(r => expect(r).to.equal('david king'))
    })

    it('should return promise value and cache its value for a key that is not in the cache', function () {
      return Repository.put('firstname2', 'david', 1)
        .then(r => Repository.put('lastname2', 'king'))
        .then(r => Repository.remember('test2', 1, function () {
          return Repository.get('firstname2')
            .then(r2 => Repository.get('lastname2')
              .then(r3 => r2 + ' ' + r3))
        }))
        .then(r => expect(r).to.equal('david king'))
        .then(r => Repository.get('test2'))
        .then(r => expect(r).to.equal('david king'))
    })
  })
})
