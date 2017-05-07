import amanda from 'amanda'
import request from 'request-promise-native'

export default function runTests (app) {
  let debug = app.debug('test')
  let api = app.swagger

  let tests = []

  for (let [path, endpoint] of Object.entries(api.paths)) {
    tests.push(test(path, endpoint)())
  }

  return Promise.all(tests).then(result => {
    console.log('OK tests pass!')
  }).catch(e => {
    console.error('FAIL:', e.stack)
  }).then(() => app.server.close())

  function test (path, endpoint) {
    return async () => {
      let errors = []
      for (let [method, desc] of Object.entries(endpoint)) {
        debug(method, path)
        let req = {}
        req.method = method
        req.url = api.schemes[0] + '://' + api.host + api.basePath + path.slice(1)
        let bodyParam = (desc.parameters || []).find(param => param.in === 'body')
        if (bodyParam) {
          req.body = bodyParam.schema.example
        }
        req.json = true
        debug(req)
        errors = await request(req).then((body, res) => {
          let validator = amanda('json')
          return new Promise(resolve => {
            try {
              validator.validate(body, desc.responses[Object.keys(desc.responses)[0]].schema, err => {
                if (err) {
                  debug(method, path, 'error:', err.message)
                  resolve(err)
                } else {
                  resolve()
                }
              })
            } catch (e) {
              debug(method, path, 'error:', e.message)
              resolve(e)
            }
          })
        })
        if (errors && errors.length) throw new Error(path + ': ' + errors[0].message)
      }
    }
  }
}
