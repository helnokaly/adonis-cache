# AdonisCache

This is a cache service provider for AdonisJS framework

- [Installation](#installation)
- [Configuration](#configuration)
    - [Driver Prerequisites](#driver-prerequisites)
- [Cache Usage](#cache-usage)
    - [Obtaining A Cache Instance](#obtaining-a-cache-instance)
    - [Retrieving Items From The Cache](#retrieving-items-from-the-cache)
    - [Storing Items In The Cache](#storing-items-in-the-cache)
    - [Removing Items From The Cache](#removing-items-from-the-cache)
- [Cache Tags](#cache-tags)
    - [Storing Tagged Cache Items](#storing-tagged-cache-items)
    - [Accessing Tagged Cache Items](#accessing-tagged-cache-items)
    - [Removing Tagged Cache Items](#removing-tagged-cache-items)
- [Events](#events)

<a name="installation"></a>
## Installation

```js
npm i adonis-cache --save
```

After installation, you need to register the providers inside `start/app.js` file.

##### start/app.js
```javascript
const providers = [
  ...,
  'adonis-cache/providers/CacheProvider'
]
```

Also, for registering commands.

##### start/app.js
```javascript
const aceProviders = [
  ...,
  'adonis-cache/providers/CommandsProvider'
]
```

Also, it is a good practice to setup an alias to avoid typing the complete namespace.

##### start/app.js
```javascript
const aliases = {
  ...,
  Cache: 'Adonis/Addons/Cache'
}
```

Then, for generating a config file.
```bash
adonis cache:config
```

<a name="configuration"></a>
## Configuration

AdonisCache provides an expressive, unified API for various caching backends. The cache configuration is located at `config/cache.js`. In this file you may specify which cache driver you would like used by default throughout your application. AdonisCache supports popular caching backends like [Redis](http://redis.io) out of the box.

The cache configuration file also contains various other options, which are documented within the file, so make sure to read over these options. By default, AdonisCache is configured to use the `object` cache driver, which stores cached objects in plain JavaScript object (use only for development). For larger applications, it is recommended that you use a more robust driver such as Redis. You may even configure multiple cache configurations for the same driver.

<a name="driver-prerequisites"></a>
### Driver Prerequisites

#### Database

When using the `database` cache driver, you will need to setup a table to contain the cache items. You'll find an example `Schema` declaration for the table below:
```javascript
this.create('cache', (table) => {
  table.string('key').unique()
  table.text('value')
  table.integer('expiration')
})
```

> {tip} You may also use the `adonis cache:table` Ace command to generate a migration with the proper schema.

#### Redis

Before using a Redis cache, you will need to have the Redis provider installed.

For more information on configuring Redis, consult its [AdonisJs documentation page](http://adonisjs.com/docs/redis).

<a name="cache-usage"></a>
## Cache Usage

<a name="obtaining-a-cache-instance"></a>
### Obtaining A Cache Instance

```javascript
'use strict'

const Cache = use('Cache')

class UserController {

  async index(request, response) {
    const value = await Cache.get('key')

    //
  }
}
```

#### Accessing Multiple Cache Stores

You may access various cache stores via the `store` method. The key passed to the `store` method should correspond to one of the stores listed in the `stores` configuration object in your `cache` configuration file:

```javascript
value = await Cache.store('database').get('foo')

await Cache.store('redis').put('bar', 'baz', 10)
```
<a name="retrieving-items-from-the-cache"></a>
### Retrieving Items From The Cache

The `get` method is used to retrieve items from the cache. If the item does not exist in the cache, `null` will be returned. If you wish, you may pass a second argument to the `get` method specifying the default value you wish to be returned if the item doesn't exist:

```javascript
value = await Cache.get('key')

value = await Cache.get('key', 'default')
```

You may even pass a `Closure` as the default value. The result of the `Closure` will be returned if the specified item does not exist in the cache. Passing a Closure allows you to defer the retrieval of default values from a database or other external service:

```javascript
value = await Cache.get('key', async () => {
  return await Database.table(...).where(...).first()
})
```

Retrieving multiple items:

```javascript
values = await Cache.many(['key1', 'key2', 'key3'])
//  values = {
//    key1: value,
//    key2: value,
//    key3: value
//  }
```

#### Checking For Item Existence

The `has` method may be used to determine if an item exists in the cache:

```javascript
if (await Cache.has('key')) {
  //
}
```

#### Incrementing / Decrementing Values

The `increment` and `decrement` methods may be used to adjust the value of integer items in the cache. Both of these methods accept an optional second argument indicating the amount by which to increment or decrement the item's value:

```javascript
await Cache.increment('key')
await Cache.increment('key', amount)
await Cache.decrement('key')
await Cache.decrement('key', amount)
```

#### Retrieve & Store

Sometimes you may wish to retrieve an item from the cache, but also store a default value if the requested item doesn't exist. For example, you may wish to retrieve all users from the cache or, if they don't exist, retrieve them from the database and add them to the cache. You may do this using the `Cache.remember` method:

```javascript
value = await Cache.remember('key', minutes, async () => {
  return await Database.table(...).where(...).first()
})
```

If the item does not exist in the cache, the `Closure` passed to the `remember` method will be executed and its result will be placed in the cache.

#### Retrieve & Delete

If you need to retrieve an item from the cache and then delete the item, you may use the `pull` method. Like the `get` method, `null` will be returned if the item does not exist in the cache:

```javascript
value = await Cache.pull('key')
```

<a name="storing-items-in-the-cache"></a>
### Storing Items In The Cache

You may use the `put` method on the `Cache` to store items in the cache. When you place an item in the cache, you need to specify the number of minutes for which the value should be cached:

```javascript
await Cache.put('key', 'value', minutes)
```

Instead of passing the number of minutes as an integer, you may also pass a `Date` instance representing the expiration time of the cached item:

```javascript
const expiresAt = new Date(2016, 11, 1, 12, 0)

await Cache.put('key', 'value', expiresAt)
```

Storing multiple items:

```javascript
const items = {
  key1: 'value1',
  key2: 'value2',
  key3: 'value3'
}

await Cache.putMany(items, minutes)
```

#### Store If Not Present

The `add` method will only add the item to the cache if it does not already exist in the cache store. The method will return `true` if the item is actually added to the cache. Otherwise, the method will return `false`:

```javascript
await Cache.add('key', 'value', minutes)
```

#### Storing Items Forever

The `forever` method may be used to store an item in the cache permanently. Since these items will not expire, they must be manually removed from the cache using the `forget` method:

```javascript
await Cache.forever('key', 'value')
```

<a name="removing-items-from-the-cache"></a>
### Removing Items From The Cache

You may remove items from the cache using the `forget` method:

```javascript
await Cache.forget('key')
```

You may clear the entire cache using the `flush` method:

```javascript
await Cache.flush()
```

> {note} Flushing the cache does not respect the cache prefix and will remove all entries from the cache. Consider this carefully when clearing a cache which is shared by other applications.

<a name="cache-tags"></a>
## Cache Tags

> {note} Cache tags are not supported when using the `database` cache driver.

<a name="storing-tagged-cache-items"></a>
### Storing Tagged Cache Items

Cache tags allow you to tag related items in the cache and then flush all cached values that have been assigned a given tag. You may access a tagged cache by passing in an ordered array of tag names. For example, let's access a tagged cache and `put` value in the cache:

```javascript
await Cache.tags(['people', 'artists']).put('John', john, minutes)

await Cache.tags(['people', 'authors']).put('Anne', anne, minutes)
```

<a name="accessing-tagged-cache-items"></a>
### Accessing Tagged Cache Items

To retrieve a tagged cache item, pass the same ordered list of tags to the `tags` method and then call the `get` method with the key you wish to retrieve:

```javascript
const john = await Cache.tags(['people', 'artists']).get('John')

const anne = await Cache.tags(['people', 'authors']).get('Anne')
```

<a name="removing-tagged-cache-items"></a>
### Removing Tagged Cache Items

You may flush all items that are assigned a tag or list of tags. For example, this statement would remove all caches tagged with either `people`, `authors`, or both. So, both `Anne` and `John` would be removed from the cache:

```javascript
await Cache.tags(['people', 'authors']).flush()
```

In contrast, this statement would remove only caches tagged with `authors`, so `Anne` would be removed, but not `John`:

```javascript
await Cache.tags('authors').flush()
```

<a name="events"></a>
## Events

To execute code on every cache operation, you may listen for the [events](http://adonisjs.com/docs/events) fired by the cache. Typically, you should place these event listeners within your `start/events.js`:

```
Cache.hit
Cache.missed
Cache.keyForgotten
Cache.keyWritten
```
