import humanId from 'human-id'

console.log(
    humanId({
        adjectiveCount: 0,
        addAdverb: false,
        separator: '-',
        capitalize: false
    })
)

console.log(humanId(false))
