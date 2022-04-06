import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { forEach, last, split, startsWith } from 'lodash'
import passport from 'passport'
import { Actions, roleCan, Roles } from '../../configs'
import { ApplicationError, RequestValidationError } from '../../errors'

export interface AuthRequest extends Request {
  user?: {
    role?: string
  }
}

export interface QueryRequest extends Request {
  sorts?: { [key: string]: 1 | -1 }
  filter?: { [key: string]: string }
}

export class BaseMiddleware {
  public deserializeUser(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('jwt', { session: false }, (_, user) => {
      req.user = req.user || user
      return next()
    })(req, res, next)
  }

  protected getRole(req: AuthRequest): Roles {
    return String(req.user?.role || 'guest') as Roles
  }

  public isAdmin(req: AuthRequest): boolean {
    return this.getRole(req) === 'admin' || this.getRole(req) === 'super_admin'
  }

  public validateError(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req).formatWith(err => {
      return { message: err.msg }
    })
    if (!errors.isEmpty()) {
      return next(new RequestValidationError(errors.mapped()))
    }
    return next()
  }

  public requireRoleCan = (action: Actions) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (roleCan({ role: String(req.user?.role || 'guest'), action })) {
      return next()
    }
    return next(new ApplicationError('action_unauthorized'))
  }

  public mapQuery(req: QueryRequest, res: Response, next: NextFunction) {
    const queries = req.query

    const prefixSort = 'sort_'
    const prefixFilter = 'filter_'

    const sorts: { [key: string]: -1 | 1 } = {}
    const filters: { [key: string]: string } = {}
    forEach(queries, (value, key) => {
      if (startsWith(key, prefixSort) && (value === 'asc' || value === 'desc')) {
        sorts[String(last(split(key, prefixSort)))] = value === 'asc' ? 1 : -1
      }
      if (startsWith(key, prefixFilter) && value) {
        filters[String(last(split(key, prefixFilter)))] = String(value)
      }
    })
    req.sorts = sorts
    req.filter = filters
    next()
  }
}
