import { Request } from 'express'
import { Roles } from '../../configs'
import { AuthRequest } from '../../filters/middleware'
import { setData } from '../../provider/cache'
export class BaseController {
  public isAdmin(req: AuthRequest): boolean {
    const role = String(req?.user?.role || 'guest') as Roles
    return role === 'admin' || role === 'super_admin'
  }

  protected getClientInfo(req: Request) {
    return {
      ip:
        String(req.headers['x-forwarded-for'] || '')
          .split(',')
          .pop()
          ?.trim() ||
        req.socket.remoteAddress ||
        req.ip,
      agent: req.headers['user-agent'],
      user: req.user
    }
  }

  // eslint-disable-next-line no-undef
  protected async writeCache(req: Request, modulePrefix: ModulePrefixKey, data: any, secondsExpired: number = 5 * 60) {
    if (!data) return false
    try {
      const key = `${modulePrefix}_${req.url}`
      return await setData(key, JSON.stringify(data), secondsExpired)
    } catch {}
  }

  protected async writeMediaCache(
    req: Request,
    // eslint-disable-next-line no-undef
    modulePrefix: ModulePrefixKey,
    data: {
      headers: { [key: string]: any }
      content: Buffer
    },
    secondsExpired: number = 5 * 60
  ) {
    if (!data) return false
    try {
      const key = `${modulePrefix}_${req.url}`
      return await setData(key, JSON.stringify(data), secondsExpired)
    } catch {}
  }
}
