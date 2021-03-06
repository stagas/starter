import path from 'path'
import fs from 'fs'

let swagger = {
  produces: 'application/json'
}

let paths = swagger.paths = {}

let responses = {
  200: { description: 'OK' }
}

module.exports = (options = { file: '/../swagger.json' }) => {
  options.controllers = options.controllers || []

  let ctrls = Object.entries(options.controllers)
  if (ctrls) {
    for (let [path] of ctrls) {
      let tags = [path]
      let definition = {
        get: { summary: 'Gets a list of ' + path, tags, responses },
        post: { summary: 'Creates a ' + path, tags, responses }
      }
      paths['/' + path] = definition
      definition = {
        get: { summary: 'Gets a ' + path, tags, responses },
        put: { summary: 'Updates a ' + path, tags, responses },
        delete: { summary: 'Deletes a ' + path, tags, responses }
      }
      paths['/' + path + '/{id}'] = definition
      definition.parameters = [
        {
          in: 'path',
          name: 'id',
          type: 'integer',
          required: true,
          description: 'Resource id'
        }
      ]
    }
  }

  fs.writeFileSync(path.join(__dirname, '..', options.file), JSON.stringify(swagger, null, 2), 'utf8')
}
