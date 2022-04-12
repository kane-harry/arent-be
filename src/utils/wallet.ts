import { ethers } from 'ethers'

export const createWallet = () => {
  const wallet = ethers.Wallet.createRandom()
  return {
    public: wallet.address,
    private: wallet.privateKey
  }
}
