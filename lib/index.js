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

export default env => {
  debug('init', env)

  let app = new Koa()

  let api = app.api = swagger.loadDocumentSync(env.swagger)

  app.env = env

  app.router = new Router()

  app.debug = (namespace) => {
    return Debug(`${env.name}:${namespace}`)
  }

  app.controller = (name, action) => {
    return async (ctx) => {
      ctx.debug = app.debug(`controller:${name}`)
      ctx.debug(action.name, name)
      await action(ctx)
    }
  }

  app.use(logger(env.logger || 'dev'))
  app.use(cors())
  app.use(helmet())

  debug('static server :', env.static)
  app.use(serve(env.static))

  app.use(docs(api, '/api-docs'))

  app.use(body())
  app.use(json())
  app.use(compress())
  app.use(conditional())
  app.use(etag())

  app.use((ctx, next) => {
    ctx.app = app
    return next()
  })

  app.router.get('/version', ctx => {
    ctx.body = env.version
  })

  app.router.get('/healthcheck', ctx => {
    ctx.body = 'healthy'
  })

  app.run = function (
    port = env.port || 3000,
    host = env.host || '0.0.0.0'
  ) {
    return new Promise(resolve => {
      for (let [path, endpoint] of Object.entries(api.paths)) {
        path = path.replace(/\{(.*?)\}/g, ':$1')
        for (let [method, desc] of Object.entries(endpoint)) {
          let [controllerName, controllerMethod] = desc.action.split('.')
          debug('create route :', method.toUpperCase(), path, '->', desc.action)
          let controller = app.controller(
            controllerName,
            app.controllers[controllerName][controllerMethod] ||
              app.controllers.crud[controllerMethod]
          )
          app.router[method.toLowerCase()](path, controller)
        }
      }

      app.use(app.router.routes())

      debug(`run(${port}, '${host}')`)
      app.server = app.listen(port, host, () => {
        debug('server listening : http://%s:%d', host, port)
        resolve()
      })
    })
  }

  return app
}
