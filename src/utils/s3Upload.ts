import multer from 'multer'
import sharp from 'sharp'
import { S3 } from 'aws-sdk'
import { config } from '@config'
import { v4 as uuidV4 } from 'uuid'
import ApplicationException from '@exceptions/application.exception'
import { CommonErrors } from '@exceptions/custom.error'
import { forEach, isArray, last, map, split } from 'lodash'

export const uploadFiles = async (files: any, folder: string, resizeOptions: any) => {
    map(files, file => {
        const shouldResize = file.mimetype.toLowerCase() !== 'image/gif' && /^image/i.test(file.mimetype)
        const suffix = file.originalname.slice(file.originalname.lastIndexOf('.'))
        const filename = uuidV4() + suffix
    })

    return files
}
