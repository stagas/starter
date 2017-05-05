[![Build Status](https://travis-ci.org/blended/starter.svg?branch=master)](https://travis-ci.org/blended/starter)

starter
=======

A rest API framework on top of koa

### Getting started

```sh
$ npm install starter --save
```

Then setup your application as follows:

```javascript
// app.js
import starter from 'starter'
import models from './api/models'
import env from './config/env'

let app = starter(env)

export default app

if (require.main === module) {
  let port = process.argv[2]
  models(env.db).then(db => {
    app.db = db
    app.run(port)
  })
}
```

and run it with `node app.js [port]`. If no port is set the app will run on port 3000.

### Developing

```sh
$ yarn install
```

### Test

```sh
$ yarn test
```
