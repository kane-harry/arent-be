import { config } from '@config'
import { ethers } from 'ethers'

/**
 * Parse human amount to big number
 * @param amount number
 * @returns ethers.BigNumber
 */
export const parsePrimeAmount = (amount: number) => {
    const decimal = config.system.primeDecimals
    return ethers.utils.parseUnits(amount.toLocaleString('fullwide', { maximumFractionDigits: decimal }), decimal)
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
