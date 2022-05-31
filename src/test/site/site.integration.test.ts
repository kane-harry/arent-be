import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest} from '../init/db'
import server from '@app/server'

chai.use(chaiAsPromised)
const { expect, assert } = chai

describe('Site', () => {
    it('FederationHeartBeat', async () => {
        const lockResponse = await request(server.app)
            .get(`/sites/fed/hello`)
        expect(lockResponse.status).equal(200)
    }).timeout(10000)

    it('CoinServerHeartBeat', async () => {
        const lockResponse = await request(server.app)
            .get(`/sites/coin/hello`)
        expect(lockResponse.status).equal(200)
    }).timeout(10000)
})
