import Debug from 'debug'
import Koa from 'koa'
import Router from 'koa-router'
import logger from 'koa-logger'
import cors from 'kcors'
import helmet from 'koa-helmet'
import serve from 'koa-static'
import body from 'koa-bodyparser'
import json from 'koa-json'
import compress from 'koa-compress'
import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import { ui as docs } from 'swagger2-koa'
import * as swagger from 'swagger2'
import testRunner from './test-runner'

const debug = Debug('starter')

export const test = testRunner

export default (api, config) => {
  debug('init', config)

  let app = new Koa()

  app.api = api
  app.config = config

  app.swagger = swagger.loadDocumentSync(config.swagger)

  app.router = new Router()

  app.debug = (namespace) => {
    return Debug(`${config.name}:${namespace}`)
  }

  app.controller = (name, action) => {
    return async (ctx) => {
      ctx.debug = app.debug(`controller:${name}`)
      ctx.debug(action.name, name)
      await action(ctx)
    }
  }

  app.use(logger(config.logger || 'dev'))
  app.use(cors())
  app.use(helmet())

  debug('static server :', config.static)
  app.use(serve(config.static))

  app.use(docs(app.swagger, '/api-docs'))

  app.use(body())
  app.use(json())
  app.use(compress())
  app.use(conditional())
  app.use(etag())

  app.context.app = app

  app.router.get('/version', ctx => {
    ctx.body = config.version
  })

  app.router.get('/healthcheck', ctx => {
    ctx.body = 'healthy'
  })

  app.run = function (
    port = config.port || 3000,
    host = config.host || '0.0.0.0'
  ) {
    return api.bootstrap(app)
      .then(() => {
        return new Promise(resolve => {
          mapRoutes(app)

          app.use(app.router.routes())

          debug(`run(${port}, '${host}')`)
          app.server = app.listen(port, host, () => {
            debug('server listening : http://%s:%d', host, port)
            resolve()
          })
        })
      })
  }

  app.test = () => {
    return testRunner(app)
  }

  return app
}

function mapRoutes (app) {
  for (let [path, endpoint] of Object.entries(app.swagger.paths)) {
    path = path.replace(/\{(.*?)\}/g, ':$1')
    for (let [method, desc] of Object.entries(endpoint)) {
      let [controllerName, controllerMethod] = desc.action.split('.')
      let controller = app.controller(
        controllerName,
        app.controllers[controllerName][controllerMethod] ||
          app.controllers.crud[controllerMethod]
      )
      let scopes = []
      let policies = []
      if (desc.security) {
        let security = desc.security[0]
        for (let [schema, scope] of Object.entries(security)) {
          policies.push(app.policies[schema](scope, app))
          scopes = scopes.concat(scope)
        }
      }
      debug('create route :', method.toUpperCase(), path, scopes, '->', desc.action)
      app.router[method.toLowerCase()](path, ...policies, controller)
    }
  }
}
