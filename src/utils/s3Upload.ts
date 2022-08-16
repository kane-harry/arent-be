import sharp from 'sharp'
import { S3 } from 'aws-sdk'
import { config } from '@config'
import { v4 as uuidV4 } from 'uuid'
import { isArray, last, map, split } from 'lodash'

interface IUploadResp {
    fieldname: string
    type: string
    name: string
    location: string
    key: string
}

export const uploadFiles = async (files: any, folder: string): Promise<IUploadResp[]> => {
    const s3 = new S3({
        credentials: {
            accessKeyId: config.amazonS3.key,
            secretAccessKey: config.amazonS3.secret
        },
        region: config.amazonS3.region
    })

    const defaultParams = {
        Bucket: config.amazonS3.bucket,
        ACL: 'public-read'
    }

    const uploader = map(files, (file: any) => {
        const suffix = last(split(file?.originalname, '.'))
        const filename = `${uuidV4()}.${suffix}`

        return s3
            .upload({
                ...defaultParams,
                Key: folder ? `${folder}/${file.fieldname}/${filename}` : `upload/${filename}`,
                Body: file.buffer
            })
            .promise()
    })

    const filesUploaded = map(await Promise.all(uploader), (el, idx) => {
        return {
            fieldname: files[idx]?.fieldname,
            type: files[idx]?.type,
            name: files[idx]?.originalname,
            location: el.Location,
            key: el.Key
        }
    })
    return filesUploaded
}

export const resizeImages = async (
    files: any,
    resizeOptions: {
        [key: string]: {
            maxSize: number
            id: string
        }[]
    }
) => {
    let newFilesOps: any[] = []
    for (const file of files) {
        const suffix = file.originalname.slice(file.originalname.lastIndexOf('.'))
        const fileName = uuidV4() + suffix

        const sizes = resizeOptions[file.fieldname]
        if (!isArray(sizes)) {
            file.type = 'original'
            newFilesOps.push(file)
            continue
        }
        const originalFile = {
            ...file,
            type: file.type ?? 'original',
            originalname: 'original' + '-' + fileName
        }
        newFilesOps.push(originalFile)

        const shouldTransform = file.mimetype.toLowerCase() !== 'image/gif' && /^image/i.test(file.mimetype)
        if (shouldTransform) {
            const newFiles = map(sizes, async curSize => {
                const data = await sharp(file.buffer).resize(curSize.maxSize, curSize.maxSize, { fit: sharp.fit.inside }).jpeg().toBuffer()
                return {
                    ...file,
                    buffer: data,
                    originalname: curSize.id + '-' + fileName,
                    type: curSize.id,
                    size: data.length
                }
            })
            const thumbs = await Promise.all(newFiles)
            newFilesOps = [...newFilesOps, ...thumbs]
        } else {
            const newFiles = map(sizes, curSize => {
                return {
                    ...file,
                    originalname: curSize.id + '-' + fileName,
                    type: curSize.id,
                    size: file.size
                }
            })
            newFilesOps = [...newFilesOps, ...newFiles]
        }
    }
    return newFilesOps
}
