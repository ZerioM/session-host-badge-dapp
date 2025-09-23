export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

export function isAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet'
    case 11155111:
      return 'Sepolia Testnet'
    case 31337:
      return 'Hardhat Local'
    default:
      return `Chain ${chainId}`
  }
}

export function getBlockExplorerUrl(chainId: number, txHash: string): string | null {
  switch (chainId) {
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`
    default:
      return null
  }
}