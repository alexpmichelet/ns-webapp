// Lightweight helper to access Payload in server contexts
import { getPayload } from 'payload'
import config from '@payload-config'

// Export a Promise that resolves to the Payload instance
// Many call sites use default import and then call payload.find / update, etc.
// We expose a proxy that awaits getPayload on first access.

let cached: any

async function getInstance() {
  if (!cached) {
    cached = await getPayload({ config })
  }
  return cached
}

const handler: ProxyHandler<any> = {
  get(_target, prop) {
    return async (...args: any[]) => {
      const payload = await getInstance()
      const fn = (payload as any)[prop]
      if (typeof fn !== 'function') return fn
      return fn.apply(payload, args)
    }
  },
}

// Default export behaves like the payload client when awaited method-wise
const payloadProxy = new Proxy({}, handler)

export default payloadProxy as any
