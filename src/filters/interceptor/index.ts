import { map, omit } from 'lodash'
import { Roles } from '../../configs'
import { AuthRequest } from '../middleware'

export class BaseInterceptor {
  protected getRole(req: AuthRequest): Roles {
    return String(req?.user?.role || 'guest') as Roles
  }

  public isAdmin(req: AuthRequest): boolean {
    return this.getRole(req) === 'admin' || this.getRole(req) === 'super_admin'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getSecurityFields(req: any): string[] {
    return []
  }

  public pluckSecurityField(data: any, securityField: string[]) {
    if (!data) {
      return data
    }
    if (data.current_page !== undefined && data.total_pages !== undefined) {
      return {
        ...data,
        items: map(data.items || [], el => {
          return omit(el, securityField)
        })
      }
    }
    return omit(data, securityField)
  }
}
