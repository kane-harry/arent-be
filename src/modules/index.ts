import { Express } from 'express'
import userRoutes from './user/user.routes'

export const routers = (app: Express) => {
  userRoutes(app)

  app.get('/', (req, res) => {
    res.json({ test: 'Hello' })
  })

  app.get('/hello', (req, res) => {
    res.json({ test: 'Hello' })
  })
}
