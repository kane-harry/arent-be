import { config } from '@config'
import { find } from 'lodash'

const role = {
    admin: { name: 'admin', id: 999 },
    user: { name: 'user', id: 0 }
}

const roles: {
    [key: string]: {
        id: number
        can: string[]
    }
} = {
    admin: {
        id: 999,
        can: []
    },
    user: {
        id: 0,
        can: []
    },
    customer_service: {
        id: 10,
        can: [
            config.operations.TASKS_LIST_BY_USER,
            config.operations.USERS_DETAIL,
            config.operations.USER_LIST_EXPORT,
            config.operations.TRANSACTION_LIST,
            config.operations.TRANSACTION_DETAIL,
            config.operations.LOG_LIST,
            config.operations.COIN_TRANSACTION_LIST,
            config.operations.COIN_TRANSACTION_DETAIL,
            config.operations.TRADES_DETAIL,
            config.operations.UPDATE_PHONE_STATUS,
            config.operations.RESET_TOTP,
            config.operations.VIEW_USER_DETAIL,
            config.operations.ACCOUNT_DETAIL_LOADED,
            config.operations.USERS_PRESALE,
            config.operations.USERS_PRESALE_LIST
        ]
    },
    customer_service_admin: {
        id: 20,
        can: [
            config.operations.TASKS_LIST_USER_KYC,
            config.operations.TASK_APPROVE_USER_KYC,
            config.operations.TASK_REJECT_USER_KYC,
            config.operations.USERS_DETAIL,
            config.operations.TASKS_LIST_USER_BANK,
            config.operations.TASK_APPROVE_USER_BANK,
            config.operations.TASK_REJECT_USER_BANK,
            config.operations.TASK_EXPORT_USER_BANK,
            config.operations.LOG_LIST,
            config.operations.TRANSACTION_LIST,
            config.operations.EXPORT_TRANSACTION_LIST,
            config.operations.TRANSACTION_DETAIL,
            config.operations.ACCOUNT_RESET_SYNC_TIME,
            config.operations.ACCOUNT_DETAIL_LOADED,
            config.operations.COIN_TRANSACTION_LIST,
            config.operations.COIN_TRANSACTION_DETAIL
        ]
    }
}

// extend role to inherit other roles permissions
// roles.customer_service.can = roles.customer_service.can.concat(roles.customer_service_id_approver.can)
// roles.customer_service.can = roles.customer_service.can.concat(roles.customer_service_bank_verifier.can)
// roles.customer_service.can = roles.customer_service.can.concat(roles.customer_service_bank_chat.can)

const isAdmin = (roleObj: any) => {
    return roleObj === roles.admin.id
}

const can = (role: number, operation: string) => {
    if (isAdmin(role)) {
        return true
    }

    const matchingRole = find(roles, el => {
        return el.id === role
    })

    return matchingRole && matchingRole.can.includes(operation)
}

const userCan = (operation: string) => {
    return [
        (req: any, res: any, next: any) => {
            if (operation === config.operations.API_DOCUMENTATION) {
                if (config.system.applicationEnableApiDoc) {
                    return next()
                }
                return res.sendStatus(401)
            }

            const userRole = req.user.role

            if (userRole === roles.user.id && operation === config.operations.USERS_DETAIL && req.user.key === req.params.key) {
                return next()
            }

            if (can(userRole, operation)) {
                return next()
            }

            return res.sendStatus(401)
        }
    ]
}

const requireAdmin = () => {
    return [
        (req: any, res: any, next: any) => {
            if (req.user.role === roles.admin.id) {
                next()
            } else {
                return res.sendStatus(401)
            }
        }
    ]
}

const requireOwner = (section: string) => {
    return [
        (req: any, res: any, next: any) => {
            if (req.user.role === roles.admin.id) {
                return next()
            }
            if (section === 'users') {
                if (req.user.key === req.params.key || can(req.user.role, config.operations.USERS_DETAIL)) {
                    return next()
                }
            }
            if (section === 'logs') {
                if (req.user.key === req.params.key) {
                    return next()
                }
            }
            if (section === 'accounts') {
                if (req.user.key === req.params.key) {
                    return next()
                }
            }
            return res.sendStatus(401)
        }
    ]
}

export { requireAdmin, requireOwner, isAdmin, can, userCan, role }
