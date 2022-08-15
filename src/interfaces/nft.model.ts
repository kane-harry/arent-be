export class NftRO<T> {
    nft: any
    collection: any
    creator: any
    owner: any
    constructor(nft: any, owner: any, creator: any, collection: any) {
        this.nft = nft
        this.collection = collection
        this.creator = { key: creator.key, chat_name: creator.chat_name, avatar: creator.avatar }
        this.owner = { key: owner.key, chat_name: owner.chat_name, avatar: owner.avatar }
    }
}
