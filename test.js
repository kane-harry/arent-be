const _ = require('lodash')
const email = 'test-001@abc.com'

console.log(_.first(email.split('@')))
