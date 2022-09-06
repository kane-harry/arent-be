import NftService from '@modules/nft/nft.service'

const buyNftProcess = async (job: any, done: any) => {
    try {
        const data = job.data
        await NftService.buyNft(data.key, data.buyNftDto)
        done()
    } catch (error) {
        console.log(error)
        done(error)
    }
}

export default buyNftProcess
