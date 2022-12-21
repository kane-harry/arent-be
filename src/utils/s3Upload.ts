import sharp from 'sharp'
import { S3 } from 'aws-sdk'
import { config } from '@config'
import { v4 as uuidV4 } from 'uuid'
import { find, isArray, isEmpty, last, map, some, split } from 'lodash'
import BizException from '@exceptions/biz.exception'
import { CommonErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import path from 'path'

interface IUploadResp {
    fieldname: string
    type: string
    name: string
    location: string
    key: string
}

export const uploadFiles = async (files: any, folder: string): Promise<IUploadResp[]> => {
    if (!files || isEmpty(files)) {
        return []
    }
    // allowed ext
    const fileTypes = /jpeg|jpg|png|gif|svg|mp4|mov|webp/

    const notAllowed = find(files, function (item) {
        const fileName = item && item.originalname && item.originalname.toLowerCase()
        const fileExtName = path.extname(fileName)
        return !fileTypes.test(fileExtName)
    })
    if (notAllowed) {
        throw new BizException(CommonErrors.uploader_file_types_error, new ErrorContext('s3Upload', 'uploadFiles', {}))
    }

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
                Key: folder ? `${folder}/${file.fieldname}/${file.type ?? 'multimedia'}/${file.originalname}` : `upload/${filename}`,
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
        const uuid = uuidV4()
        const suffix = file.originalname.slice(file.originalname.lastIndexOf('.'))
        const fileName = uuid + suffix

        const sizes = resizeOptions[file.fieldname]
        if (!isArray(sizes)) {
            file.originalname = fileName
            file.type = 'original'
            newFilesOps.push(file)
            continue
        }
        // if (!/^image/i.test(file.mimetype)) {
        //     throw new BizException(CommonErrors.uploader_image_types_error, new ErrorContext('s3Upload', 'resizeImages', {}))
        // }
        const originalFile = {
            ...file,
            type: file.type ?? 'original',
            originalname: fileName
        }
        newFilesOps.push(originalFile)
        const shouldTransform = file.mimetype.toLowerCase() !== 'image/gif' && /^image/i.test(file.mimetype)
        if (shouldTransform) {
            const fileName = uuid + '.webp'
            const newFiles = map(sizes, async curSize => {
                const data = await sharp(file.buffer)
                    .resize(curSize.maxSize, curSize.maxSize, { fit: sharp.fit.inside, withoutEnlargement: true })
                    .webp()
                    .toBuffer()
                return {
                    ...file,
                    buffer: data,
                    originalname: fileName,
                    type: curSize.id,
                    size: data.length
                }
            })
            const thumbs = await Promise.all(newFiles)
            newFilesOps = [...newFilesOps, ...thumbs]
        } else {
            const fileName = uuid + suffix
            const newFiles = map(sizes, async curSize => {
                const data = await sharp(file.buffer, { animated: true })
                    .resize(curSize.maxSize, curSize.maxSize, { fit: sharp.fit.inside, withoutEnlargement: true })
                    .gif()
                    .toBuffer()
                return {
                    ...file,
                    buffer: data,
                    originalname: fileName,
                    type: curSize.id,
                    size: data.length
                }
            })
            const thumbs = await Promise.all(newFiles)
            newFilesOps = [...newFilesOps, ...thumbs]
        }
    }
    return newFilesOps
}
