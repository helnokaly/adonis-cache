'use strict'

const chai = require('chai')
const expect = chai.expect

var Redis = require('ioredis')
var redis = new Redis()

var redisStub = {
  connection: () => redis
}
// const Store = new (require('../src/Stores/DatabaseStore'))(knex, encryptionStub, 'cache')

const Store = new (require('../src/Stores/RedisStore'))(redisStub)
const Repository = new (require('../src/Stores/Repository'))(Store)
// const TagSet = new(require('../src/Stores/TagSet'))(Store, ['post', 'bo', 'offer'])
// const RedisTaggedCache = new(require('../src/Stores/RedisTaggedCache'))(Store, TagSet)

Repository.setEventDispatcher({
  fire: function (event, model) {
    // console.log(event, '\n', model)
  }
})

describe('RedisTaggedCache', function () {
  it('should ...', function () {
    return Repository.tags(['people', 'programmer']).put('Hany', 'Hany', 1)
      .then(r => Repository.tags(['people', 'artist']).put('Hamza', 'Hamza', 1))
      .then(r => Repository.tags(['artist']).flush())
      .then(r => Repository.tags(['people', 'artist']).get('Hamza'))
      .then(r => expect(r).to.equal(null))
      .then(r => Repository.tags(['people', 'programmer']).get('Hany'))
      .then(r => expect(r).to.equal('Hany'))
  })
  it('should ...', function () {
    return Repository.tags(['people', 'programmer']).put('Hany', 'Hany', 1)
      .then(r => Repository.tags(['people', 'artist']).put('Hamza', 'Hamza', 1))
      .then(r => Repository.tags(['people']).flush())
      .then(r => Repository.tags(['people', 'artist']).get('Hamza'))
      .then(r => expect(r).to.equal(null))
      .then(r => Repository.tags(['people', 'programmer']).get('Hany'))
      .then(r => expect(r).to.equal(null))
  })
  it('should ...', function () {
    return Repository.tags(['people', 'programmer']).put('Hany', 'Hany', 1)
      .then(r => Repository.tags(['people', 'artist']).put('Hamza', 'Hamza', 1))
      .then(r => Repository.flush())
      .then(r => Repository.tags(['people', 'artist']).get('Hamza'))
      .then(r => expect(r).to.equal(null))
      .then(r => Repository.tags(['people', 'programmer']).get('Hany'))
      .then(r => expect(r).to.equal(null))
  })
})

// describe('Repository', function() {

//   describe('flush', function() {
//     it('should flush store and return undefined', function() {
//       return RedisTaggedCache.flush()
//         .then(r => expect(r).to.equal(undefined))
//         // .then(r => { RedisTaggedCache.tags('hany'); })
//     })
//   })

//   describe('has', function() {
//     it('should return false for a key that is not in the cache', function() {
//       return RedisTaggedCache.has('ruby')
//         .then(r => expect(r).to.equal(false))
//     })

//     it('should return true for a key that is in the cache', function() {
//       return RedisTaggedCache.put('ruby', 'rails', 1)
//         .then(r => expect(r).to.equal(undefined))
//         .then(r => RedisTaggedCache.has('ruby'))
//         .then(r => expect(r).to.equal(true))
//     })
//   })

//   describe('pull', function() {
//     it('should pull a value of existing key in the cache', function() {
//       return RedisTaggedCache.pull('ruby')
//         .then(r => expect(r).to.equal('rails'))
//     })

//     it('should return a null for a key that was pulled', function() {
//       return RedisTaggedCache.pull('ruby')
//         .then(r => expect(r).to.equal(null))
//     })

//      it('should return default value for a key that does not exist', function() {
//       return RedisTaggedCache.pull('ruby', 'gems')
//         .then(r => expect(r).to.equal('gems'))
//     })
//   })

//   describe('get', function() {
//     it('should get a value of existing key in the cache', function() {
//       return RedisTaggedCache.put('name', 'david', 1)
//         .then(r => expect(r).to.equal(undefined))
//         .then(r => RedisTaggedCache.get('name'))
//         .then(r => expect(r).to.equal('david'))
//     })

//     it('should return a null for a key that was pulled', function() {
//       return RedisTaggedCache.get('age')
//         .then(r => expect(r).to.equal(null))
//     })

//      it('should return default value for a key that does not exist', function() {
//       return RedisTaggedCache.get('country', 'usa')
//         .then(r => expect(r).to.equal('usa'))
//     })
//   })

//   describe('add', function() {
//     it('should return false when adding key that is in the cache and should not change value of existing one', function() {
//       return RedisTaggedCache.add('name', 'john', 1)
//         .then(r => expect(r).to.equal(false))
//         .then(r => RedisTaggedCache.get('name'))
//         .then(r => expect(r).to.equal('david'))
//     })

//     it('should return a false when adding a key with 0 minutes expiration and should not change value of existing one', function() {
//       return RedisTaggedCache.add('name', 'john', 0)
//         .then(r => expect(r).to.equal(false))
//         .then(r => RedisTaggedCache.get('name'))
//         .then(r => expect(r).to.equal('david'))
//     })

//      it('should return true when adding key that is not in the cache and should add it', function() {
//       return RedisTaggedCache.add('state', 'california', 1)
//         .then(r => expect(r).to.equal(true))
//         .then(r => RedisTaggedCache.get('state'))
//         .then(r => expect(r).to.equal('california'))
//     })
//   })

//   describe('remember', function() {
//     it('should return generator function value and cache its value for a key that is not in the cache', function() {
//       return RedisTaggedCache.put('firstname', 'david', 1)
//         .then(r => RedisTaggedCache.put('lastname', 'king'))
//         .then(r => RedisTaggedCache.remember('test', 1, function * () {
//           const temp = yield RedisTaggedCache.get('firstname')
//           const temp2 = yield RedisTaggedCache.get('lastname')
//           return temp + ' ' + temp2
//         }))
//         .then(r => expect(r).to.equal('david king'))
//         .then(r => RedisTaggedCache.get('test'))
//         .then(r => expect(r).to.equal('david king'))
//     })

//     it('should return promise value and cache its value for a key that is not in the cache', function() {
//       return RedisTaggedCache.put('firstname2', 'david', 1)
//         .then(r => RedisTaggedCache.put('lastname2', 'king'))
//         .then(r => RedisTaggedCache.remember('test2', 1, function  () {
//           return RedisTaggedCache.get('firstname2')
//             .then(r2 => RedisTaggedCache.get('lastname2')
//               .then(r3 => r2 + ' ' + r3))
//         }))
//         .then(r => expect(r).to.equal('david king'))
//         .then(r => RedisTaggedCache.get('test2'))
//         .then(r => expect(r).to.equal('david king'))
//     })
//   })

// })
