import NftService from '@modules/nft/nft.service'

const buyNftProcess = async (job: any, done: any) => {
    try {
        const data = job.data
        await NftService.buyNft(data.key, data.operator, data.agent, data.ip)
        done()
    } catch (error) {
        console.log(error)
        done(error)
    }
}

export default buyNftProcess
