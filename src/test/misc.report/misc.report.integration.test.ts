// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { MiscReportModel } from '@modules/misc_report/misc.report.model'
import { MiscReportStatus, MiscReportType } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: ''
    },
    token: '',
    miscReports: []
}

let adminShareData = { user: { key: '' }, token: '' }

const createMiscReportData = {
    description: 'description',
    data: 'data'
}

const updateMiscReportData = {
    description: 'description update',
    data: 'data update'
}

describe('Misc Report', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    it('InitDataForAdmin', async () => {
        await initDataForUser(adminShareData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it(`Create Misc Report: featureRequest`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/misc/reports`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('data', createMiscReportData.data)
            .field('description', createMiscReportData.description)
            .field('type', MiscReportType.FeatureRequest)
            .attach('video', './src/test/init/test.mp4')
            .attach('images', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const miscReport = await MiscReportModel.findOne({ key: res.body.key })
        //Form data
        expect(miscReport.type).equal(MiscReportType.FeatureRequest)
        expect(miscReport.status).equal(MiscReportStatus.Pending)
        expect(miscReport.description).equal(createMiscReportData.description)
        expect(miscReport.video.length).gt(0)
        expect(miscReport.images.length).gt(0)
        expect(miscReport.data).equal(createMiscReportData.data)
        expect(miscReport.submitter.key).equal(shareData.user.key)

        //Relation
        expect(miscReport.replay).not.exist
        expect(miscReport.worker).not.exist
    }).timeout(30000)

    it(`Create Misc Report: featureRequest`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/misc/reports`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('data', createMiscReportData.data)
            .field('description', createMiscReportData.description)
            .field('type', MiscReportType.Bug)
            .attach('video', './src/test/init/test.mp4')
            .attach('images', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const miscReport = await MiscReportModel.findOne({ key: res.body.key })
        //Form data
        expect(miscReport.type).equal(MiscReportType.Bug)
        expect(miscReport.status).equal(MiscReportStatus.Pending)
        expect(miscReport.description).equal(createMiscReportData.description)
        expect(miscReport.video.length).gt(0)
        expect(miscReport.images.length).gt(0)
        expect(miscReport.data).equal(createMiscReportData.data)
        expect(miscReport.submitter.key).equal(shareData.user.key)

        //Relation
        expect(miscReport.replay).not.exist
        expect(miscReport.worker).not.exist
    }).timeout(30000)

    it(`List Misc Reports`, async () => {
        const res = await request(server.app).get(`/api/v1/misc/reports`)
        expect(res.status).equal(200)
        validResponse(res.body)
        shareData.miscReports = res.body.items
    }).timeout(10000)

    it(`List Misc Reports by terms`, async () => {
        const terms = 'des'
        const res = await request(server.app).get(`/api/v1/misc/reports?terms=${terms}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
        const items = res.body.items.filter(item => !(item.description.includes(terms) || item.data.includes(terms)))
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List Misc Reports by submitter`, async () => {
        const chat_name = shareData.user.chat_name
        const res = await request(server.app).get(`/api/v1/misc/reports?submitter=${chat_name}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
        const items = res.body.items.filter(item => item.submitter.chat_name !== chat_name)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List Misc Reports by type`, async () => {
        const type = MiscReportType.Bug
        const res = await request(server.app).get(`/api/v1/misc/reports?type=${type}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
        const items = res.body.items.filter(item => item.type !== type)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List Misc Reports by status`, async () => {
        const status = MiscReportStatus.Pending
        const res = await request(server.app).get(`/api/v1/misc/reports?status=${status}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
        const items = res.body.items.filter(item => item.status !== status)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`Get Misc Report Detail`, async () => {
        const res = await request(server.app)
            .get(`/api/v1/misc/reports/${shareData.miscReports[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const miscReport = await MiscReportModel.findOne({ key: shareData.miscReports[0].key })
        expect(miscReport.type).equal(res.body.type)
        expect(miscReport.status).equal(res.body.status)
        expect(miscReport.description).equal(res.body.description)
        expect(miscReport.data).equal(res.body.data)

        expect(miscReport.images.length).equal(res.body.images.length)
        expect(miscReport.video.length).equal(res.body.video.length)
        expect(miscReport.submitter.key).equal(res.body.submitter.key)
        expect(miscReport.replay).equal(res.body.replay)
        expect(miscReport.worker).equal(res.body.worker)
    }).timeout(10000)

    it(`Update Misc Report`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/misc/reports/${shareData.miscReports[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(updateMiscReportData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const miscReport = await MiscReportModel.findOne({ key: shareData.miscReports[0].key })
        expect(miscReport.data).equal(updateMiscReportData.data)
        expect(miscReport.description).equal(updateMiscReportData.description)
    }).timeout(10000)

    it(`Admin Update Misc Report`, async () => {
        const adminUpdateData = { ...updateMiscReportData, replay: 'replay' }
        const res = await request(server.app)
            .put(`/api/v1/misc/reports/${shareData.miscReports[0].key}/admin`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send(adminUpdateData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const miscReport = await MiscReportModel.findOne({ key: shareData.miscReports[0].key })
        expect(miscReport.data).equal(adminUpdateData.data)
        expect(miscReport.description).equal(adminUpdateData.description)
        expect(miscReport.replay).equal(adminUpdateData.replay)
    }).timeout(10000)

    it(`Bulk Resolved Misc Report`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/misc/reports/status`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({ status: MiscReportStatus.Resolved, keys: [shareData.miscReports[0].key] })
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`Bulk Remove Misc Report`, async () => {
        const res = await request(server.app)
            .delete(`/api/v1/misc/reports`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({ keys: [shareData.miscReports[0].key] })
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)
})
