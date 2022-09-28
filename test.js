const _ = require('lodash')
const email = 'test-001@abc.com'

console.log(_.first(email.split('@')))

const { uniqueNamesGenerator, adjectives, colors, animals, names, NumberDictionary } = require('unique-names-generator')

const numberDictionary = NumberDictionary.generate({ min: 100, max: 999 })

const randomName = uniqueNamesGenerator({ dictionaries: [names, numberDictionary] })

const shortName = uniqueNamesGenerator({
    dictionaries: [names, numberDictionary],
    length: 2,
    separator: '-',
    style: 'lowerCase'
})

console.log(randomName)

console.log(shortName)

const moment = require('moment')

console.log(moment().format('x'))

console.log(moment().add(1, 'w').format('x'))
