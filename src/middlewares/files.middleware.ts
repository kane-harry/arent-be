// @ts-nocheck
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { S3 } from 'aws-sdk'
import { config } from '@config'
import { v4 as uuidV4 } from 'uuid'
import { forEach, isArray, last, map, split } from 'lodash'
import ApplicationException from '@exceptions/application.exception'
import { CommonErrors } from '@exceptions/custom.error'

export const handleFiles = (fields: multer.Field[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const multerStorage = multer.memoryStorage()
        const upload = multer({
            storage: multerStorage
            // add limit ?
        }).fields(fields)

        const files: any = await new Promise((resolve, reject) => {
            upload(req, res, function (err) {
                if (err) return reject(err)
                resolve(req.files)
            })
        })

        let allFiles: any[] = []

        forEach(fields, field => {
            if (!files || !files[field.name]) return
            allFiles = [
                ...allFiles,
                ...map(files[field.name], (file: any) => {
                    return {
                        ...file,
                        type: 'original',
                        name: `${file.originalname}`,
                        resizeOptions: field.resizeOptions
                    }
                })
            ]
        })
        req.files = allFiles
    } catch (err) {
        throw new ApplicationException(CommonErrors.request_validation_error, {
            class_name: 'FileValidation',
            method: 'handleFiles',
            details: String(err),
            message: null
        })
    }

    try {
        const files = req.files

        let newFilesOps: any[] = []
        forEach(files, (file: any) => {
            if (!file.resizeOptions) {
                newFilesOps.push({
                    ...file,
                    type: 'video',
                    size: file.buffer.length
                })
                return
            }
            if (file.mimetype.startsWith('video')) {
                newFilesOps.push({
                    ...file,
                    type: 'video',
                    size: file.buffer.length
                })
                return
            }
            if (file.mimetype.startsWith('image/gif')) {
                newFilesOps.push({
                    ...file,
                    type: 'image',
                    size: file.buffer.length
                })
                return
            }
            if (file.mimetype.startsWith('image')) {
                const sizes = file.resizeOptions
                if (!isArray(sizes)) return
                const fileName = `${uuidV4()}.jpeg`
                const originalFile = sharp(file.buffer)
                    .jpeg()
                    .toBuffer()
                    .then(data => {
                        return Promise.resolve({
                            ...file,
                            buffer: data,
                            originalname: 'original' + '-' + fileName,
                            type: 'original',
                            size: data.length
                        })
                    })
                    .catch(err => {
                        return Promise.reject(err)
                    })
                const newFiles = map(sizes, curSize =>
                    sharp(file.buffer)
                        .resize(curSize.maxSize, curSize.maxSize, { fit: sharp.fit.inside })
                        .jpeg()
                        .toBuffer()
                        .then(data => {
                            return Promise.resolve({
                                ...file,
                                buffer: data,
                                originalname: curSize.id + '-' + fileName,
                                type: curSize.id,
                                size: data.length
                            })
                        })
                        .catch(err => {
                            return Promise.reject(err)
                        })
                )
                newFilesOps = [...newFilesOps, originalFile, ...newFiles]
            }
        })
        req.files = await Promise.all(newFilesOps)
    } catch (err) {
        console.log(err)
        throw new ApplicationException(CommonErrors.internal_server_error, {
            class_name: 'FileValidation',
            method: 'resizeImages',
            details: String(err),
            message: null
        })
    }

    try {
        let files: any = req.files
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
            const folder = file.mimetype
            return s3
                .upload({
                    ...defaultParams,
                    Key: folder ? `${folder}/${filename}` : `upload/${filename}`,
                    Body: file.buffer,
                    Metadata: {
                        fieldname: file.fieldname,
                        type: file.type
                    }
                })
                .promise()
        })

        const filesUploaded = map(await Promise.all(uploader), (el, idx) => {
            return {
                fieldname: files[idx]?.fieldname,
                type: files[idx]?.type,
                name: files[idx]?.name,
                location: el.Location,
                key: el.Key
            }
        })
        res.locals.files_uploaded = res.locals.files_uploaded ?? []
        res.locals.files_uploaded.push(...filesUploaded)
        map(filesUploaded, (item) => {
            const type = item['type']
            req.body[item.fieldname] = req.body[item.fieldname] ?? {}
            req.body[item.fieldname][type] = item.key
        })
        next()
    } catch (err) {
        console.log(err)
        throw new ApplicationException(CommonErrors.internal_server_error, {
            class_name: 'FileValidation',
            method: 'uploadFiles',
            details: String(err),
            message: null
        })
    }
}

export const resizeImages =
    (resizeOptions: {
        [key: string]: {
            maxSize: number
            id: string
        }[]
    }) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const files = req.files

            let newFilesOps: any[] = []
            forEach(files, (file: any) => {
                if (file.mimetype.startsWith('video')) {
                    newFilesOps.push({
                        ...file,
                        type: 'video',
                        size: file.buffer.length
                    })
                }
                if (file.mimetype.startsWith('image/gif')) {
                    newFilesOps.push({
                        ...file,
                        type: 'image',
                        size: file.buffer.length
                    })
                } else {
                    if (file.mimetype.startsWith('image')) {
                        const sizes = resizeOptions[file.fieldname]
                        if (!isArray(sizes)) return
                        const fileName = `${uuidV4()}.jpeg`
                        const originalFile = sharp(file.buffer)
                            .jpeg()
                            .toBuffer()
                            .then(data => {
                                return Promise.resolve({
                                    ...file,
                                    buffer: data,
                                    originalname: 'original' + '-' + fileName,
                                    type: 'original',
                                    size: data.length
                                })
                            })
                            .catch(err => {
                                return Promise.reject(err)
                            })
                        const newFiles = map(sizes, curSize =>
                            sharp(file.buffer)
                                .resize(curSize.maxSize, curSize.maxSize, { fit: sharp.fit.inside })
                                .jpeg()
                                .toBuffer()
                                .then(data => {
                                    return Promise.resolve({
                                        ...file,
                                        buffer: data,
                                        originalname: curSize.id + '-' + fileName,
                                        type: curSize.id,
                                        size: data.length
                                    })
                                })
                                .catch(err => {
                                    return Promise.reject(err)
                                })
                        )
                        newFilesOps = [...newFilesOps, originalFile, ...newFiles]
                    }
                }
            })
            req.files = await Promise.all(newFilesOps)
            next()
        } catch (err) {
            console.log(err)
            throw new ApplicationException(CommonErrors.internal_server_error, {
                class_name: 'FileValidation',
                method: 'resizeImages',
                details: String(err),
                message: null
            })
        }
    }

export const uploadFiles = (folder?: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        let files: any = req.files
        if (folder) {
            // @ts-ignore
            files = files.filter(item => item.fieldname === folder)
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
                    Key: folder ? `${folder}/${filename}` : `upload/${filename}`,
                    Body: file.buffer,
                    Metadata: {
                        fieldname: file.fieldname,
                        type: file.type
                    }
                })
                .promise()
        })

        const filesUploaded = map(await Promise.all(uploader), (el, idx) => {
            return {
                fieldname: files[idx]?.fieldname,
                type: files[idx]?.type,
                name: files[idx]?.name,
                location: el.Location,
                key: el.Key
            }
        })
        res.locals.files_uploaded = res.locals.files_uploaded ?? []
        res.locals.files_uploaded.push(...filesUploaded)
        map(filesUploaded, (item) => {
            const type = item['type']
            req.body[item.fieldname] = {[type]: item.key}
        })
        next()
    } catch (err) {
        console.log(err)
        throw new ApplicationException(CommonErrors.internal_server_error, {
            class_name: 'FileValidation',
            method: 'uploadFiles',
            details: String(err),
            message: null
        })
    }
}
