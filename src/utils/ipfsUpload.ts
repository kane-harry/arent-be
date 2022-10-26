import { map } from 'lodash'
import { create, urlSource } from 'ipfs-http-client'
import { config } from '@config'

interface IUploadIpfsResp {
    field_name: any
    aws_key: string
    aws_url: string
    ipfs_key: string
    ipfs_cid: string
}

export const uploadIpfs = async (files: any): Promise<[IUploadIpfsResp]> => {
    const validFiles = getOriginalFiles(files)
    const auth = 'Basic ' + Buffer.from(config.ipfs.INFURA_ID + ':' + config.ipfs.INFURA_SECRET_KEY).toString('base64')
    const configInfura = {
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: auth
        }
    }
    const client = create(configInfura)

    const uploader = map(validFiles, async (file: any) => {
        return client.add(urlSource(file.aws_url))
    })

    const filesUploaded = map(await Promise.all(uploader), (el, idx) => {
        validFiles[idx].ipfs_key = el?.path
        validFiles[idx].ipfs_cid = el?.cid?.toString()
        return validFiles[idx]
    })
    // @ts-ignore
    return filesUploaded
}

export const getOriginalFiles = (files: any) => {
    const pathOriginals = files.map(function (item: any) {
        if (!item.aws_key) {
            return item
        }
        item.aws_url = `https://${config.amazonS3.bucket}.s3.${config.amazonS3.region}.amazonaws.com/${item.aws_key}`
        return item
    })

    return pathOriginals
}
