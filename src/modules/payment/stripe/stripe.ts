import SettingService from '@modules/setting/setting.service'

export default class Stripe {
    static async getStripe() {
        const setting = await SettingService.getGlobalSetting()
        const stripe = require('stripe')(
            setting.stripeApiKey
        )
        return stripe
    }

    static async createCardToken(card: any) {
        const stripe = await Stripe.getStripe()
        return await stripe.tokens.create({ card: card })
    }

    static async createCustomer(userEmail: any) {
        const description = 'Customer for Curate'
        const stripe = await Stripe.getStripe()
        return await stripe.customers.create({
            description: description,
            email: userEmail
        })
    }

    static async createCustomerWithCard(userEmail: any, card: any) {
        const description = 'Customer for Curate'
        const stripe = await Stripe.getStripe()
        const stripeCustomer = await stripe.customers.create({
            description: description,
            email: userEmail,
            source: {
                object: 'card',
                name: card.name,
                number: card.number,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                cvc: card.cvc
            }
        })

        return stripeCustomer.id
    }

    static async createCustomerWithToken(userEmail: any, token: any) {
        const description = 'Customer for Curate'
        const stripe = await Stripe.getStripe()
        const stripeCustomer = await stripe.customers.create({
            description: description,
            email: userEmail,
            source: token
        })

        return stripeCustomer.id
    }

    static async chargeUserWithStoredCard(amount: any, stripeUserID: any) {
        const description = 'Curate Recharge'
        const stripe = await Stripe.getStripe()
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'USD',
            customer: stripeUserID,
            description: description
        })
        return charge.id
    }

    static async chargeCard(amount: any, card: any) {
        const description = 'Curate Recharge'
        const stripe = await Stripe.getStripe()
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'USD',
            source: {
                object: 'card',
                number: card.number,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                cvc: card.cvc
            },
            description: description
        })
        return charge.id
    }

    static async chargeToken(amount: any, token: any) {
        const description = 'Curate Recharge'
        const stripe = await Stripe.getStripe()
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'USD',
            source: token,
            description: description
        })
        return charge.id
    }

    static async getLast4(token: any) {
        const stripe = await Stripe.getStripe()
        const customer = await stripe.customers.retrieve(token)
        if (customer && customer.sources && customer.sources.data[0] && customer.sources.data[0].last4) {
            return customer.sources.data[0].last4
        }

        return ''
    }
}
