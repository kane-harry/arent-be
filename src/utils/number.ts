import { config } from '@config'
import { ethers } from 'ethers'

/**
 * Parse human amount to big number
 * @param amount number
 * @returns ethers.BigNumber
 */
export const parsePrimeAmount = (amount: any) => {
    const decimal = config.system.primeDecimals
    try{
        amount = amount.toString().split(',').join('')
        return ethers.utils.parseUnits(amount.toString(), decimal)
    } catch (e) {
        throw e
    }
}

/**
 * Parse big number to human amount
 * @param amount string
 * @returns string
 */
export const formatAmount = (amount: string) => {
    const decimal = config.system.primeDecimals
    return ethers.utils.formatUnits(amount, decimal)
}
