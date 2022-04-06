import { includes } from 'lodash'

export type Actions =
  // authentication
  'LOGIN' | 'LOGOUT'

export type Roles = 'super_admin' | 'admin' | 'user'

export const ROLE_IDS: { [key: string]: number } = {
  super_admin: 1,
  admin: 2,
  user: 3
}

export const ROLES: { [key: string]: { id: number; can: Array<Actions> } } = {
  super_admin: {
    id: ROLE_IDS.super_admin,
    can: []
  },
  admin: {
    id: ROLE_IDS.admin,
    can: []
  },
  user: {
    id: ROLE_IDS.user,
    can: []
  }
}

type RoleParams = {
  role: string
  action: Actions
}

export const isSuperAdmin = (role: string) => {
  return ROLE_IDS[role] === ROLE_IDS.super_admin
}

export const roleCan = (params: RoleParams): boolean => {
  const { role, action } = params
  // check if full access
  if (isSuperAdmin(role)) return true

  const roleActions = ROLES[role]?.can
  return includes(roleActions, action)
}
