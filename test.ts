import { Config, names, NumberDictionary, uniqueNamesGenerator } from 'unique-names-generator'

const numberDictionary = NumberDictionary.generate({ min: 100, max: 999 })
const customConfig: Config = {
    dictionaries: [names, numberDictionary],
    length: 2,
    style: 'lowerCase'
}

console.log(uniqueNamesGenerator(customConfig))
