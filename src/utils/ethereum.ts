import { ethers } from 'ethers'

export const recoverSignature = (nonce_text: string, signature: string) => {
  return ethers.utils.verifyMessage(nonce_text, signature)
}

export const isValidAddress = (address: string) => {
  return ethers.utils.isAddress(address)
}

export const connectContract = (provider_url: string, contract_address: string, contract_abi: any[]) => {
  const provider = ethers.getDefaultProvider(provider_url)
  return new ethers.Contract(contract_address, contract_abi, provider)
}

export const parseEther = (wei: string) => {
  try {
    return ethers.utils.formatEther(wei)
  } catch {
    return 0
  }
}
