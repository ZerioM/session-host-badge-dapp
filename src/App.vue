<template>
  <div class="min-h-screen py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-4xl font-bold text-gray-900 mb-3">
          Community Badge DApp
        </h1>
        <p class="text-lg text-gray-600">
          Mint and manage Session Host badges for community members
        </p>
      </div>

      <!-- Notification -->
      <Message 
        v-if="notification.visible"
        :severity="notification.type"
        :closable="true"
        @close="hideNotification"
        class="mb-6"
      >
        {{ notification.message }}
      </Message>

      <!-- Wallet Connection -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-wallet text-blue-600"></i>
            Wallet Connection
          </div>
        </template>
        <template #content>
          <div v-if="!wallet.isConnected" class="text-center">
            <Button 
              @click="connectWallet"
              :loading="wallet.isLoading"
              icon="pi pi-wallet"
              label="Connect MetaMask"
              size="large"
              class="mb-4"
            />
            <p class="text-gray-600 text-sm">Connect your MetaMask wallet to get started</p>
          </div>
          
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="text-sm font-medium text-gray-600 block mb-1">Connected Account</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-green-600"></i>
                  <span class="font-mono font-medium">{{ shortenAddress(wallet.address) }}</span>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="text-sm font-medium text-gray-600 block mb-1">Network</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-globe text-blue-600"></i>
                  <span class="font-medium">{{ getChainName(wallet.chainId) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2 flex-wrap">
              <Button 
                @click="switchToChain(11155111)"
                :disabled="wallet.chainId === 11155111"
                icon="pi pi-refresh"
                label="Switch to Sepolia"
                size="small"
                severity="secondary"
              />
              <Button 
                @click="switchToChain(31337)"
                :disabled="wallet.chainId === 31337"
                icon="pi pi-desktop"
                label="Switch to Local (31337)"
                size="small"
                severity="secondary"
              />
            </div>
          </div>
        </template>
      </Card>
        
      <div v-if="wallet.isConnected" class="space-y-6">
        <!-- Lead Status -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-shield text-purple-600"></i>
              Your Lead Status
            </div>
          </template>
          <template #content>
            <div class="flex items-center gap-3">
              <Badge 
                :value="hasLeadRole ? 'LEAD' : 'USER'" 
                :severity="hasLeadRole ? 'success' : 'secondary'"
                size="large"
              />
              <span class="text-lg">
                {{ hasLeadRole ? 'You are a Community Lead' : 'You are not a Community Lead' }}
              </span>
            </div>
          </template>
        </Card>

        <!-- Award Badge -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-award text-yellow-600"></i>
              Award Badge
            </div>
          </template>
          <template #content>
            <form @submit.prevent="handleAward" class="space-y-4">
              <div class="flex flex-col gap-2">
                <label for="recipient" class="font-medium text-gray-700">
                  Recipient Address
                </label>
                <InputText 
                  id="recipient"
                  v-model="recipientAddress"
                  placeholder="0x..."
                  class="w-full"
                  required
                />
              </div>
              <Button 
                type="submit"
                :disabled="txPending || !hasLeadRole"
                :loading="txPending"
                icon="pi pi-send"
                :label="txPending ? 'Awarding...' : 'Award Badge'"
                size="large"
              />
              <InlineMessage v-if="!hasLeadRole" severity="warn" class="w-full">
                Only Community Leads can award badges
              </InlineMessage>
            </form>
          </template>
        </Card>

        <!-- Advanced Features -->
        <Card v-if="hasLeadRole">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-gray-600"></i>
              Advanced Features (Leads only)
            </div>
          </template>
          <template #content>
            <Accordion :activeIndex="null">
              <AccordionTab>
                <template #header>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-times-circle text-red-600"></i>
                    <span>Revoke Badge</span>
                  </div>
                </template>
                <form @submit.prevent="handleRevoke" class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <InputText 
                      v-model="revokeAddress"
                      placeholder="Address to revoke from..."
                      class="w-full"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    :disabled="txPending"
                    :loading="txPending"
                    icon="pi pi-ban"
                    :label="txPending ? 'Revoking...' : 'Revoke Badge'"
                    severity="danger"
                  />
                </form>
              </AccordionTab>
              
              <AccordionTab>
                <template #header>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-user-plus text-green-600"></i>
                    <span>Grant Lead Role</span>
                  </div>
                </template>
                <form @submit.prevent="handleGrantLead" class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <InputText 
                      v-model="grantAddress"
                      placeholder="Address to grant lead role..."
                      class="w-full"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    :disabled="txPending"
                    :loading="txPending"
                    icon="pi pi-crown"
                    :label="txPending ? 'Granting...' : 'Grant Lead Role'"
                    severity="success"
                  />
                </form>
              </AccordionTab>
            </Accordion>
          </template>
        </Card>

        <!-- Check Badge -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-search text-blue-600"></i>
              Check Badge
            </div>
          </template>
          <template #content>
            <form @submit.prevent="handleCheckBadge" class="space-y-4">
              <div class="flex flex-col gap-2">
                <label for="checkAddress" class="font-medium text-gray-700">
                  Address to Check
                </label>
                <InputText 
                  id="checkAddress"
                  v-model="checkAddress"
                  placeholder="0x..."
                  class="w-full"
                  required
                />
              </div>
              <Button 
                type="submit"
                :disabled="checkingBalance"
                :loading="checkingBalance"
                icon="pi pi-search"
                :label="checkingBalance ? 'Checking...' : 'Check Badge Balance'"
                severity="info"
              />
              
              <Panel v-if="badgeCheckResult !== null" class="mt-4">
                <template #header>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-info-circle"></i>
                    <span>Badge Status</span>
                  </div>
                </template>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-medium">Badge Balance:</span>
                    <Badge :value="badgeCheckResult" severity="info" />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-medium">Has Badge:</span>
                    <Badge 
                      :value="badgeCheckResult > 0 ? 'Yes' : 'No'" 
                      :severity="badgeCheckResult > 0 ? 'success' : 'danger'"
                    />
                  </div>
                </div>
              </Panel>
            </form>
          </template>
        </Card>

        <!-- Transaction Status -->
        <Card v-if="lastTxHash">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-history text-indigo-600"></i>
              Last Transaction
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-link text-gray-600"></i>
                  <span class="font-medium text-sm">Transaction Hash</span>
                </div>
                <code class="text-xs break-all text-gray-800">{{ lastTxHash }}</code>
              </div>
              <div v-if="getBlockExplorerUrl(wallet.chainId, lastTxHash)">
                <Button 
                  :label="`View on ${getChainName(wallet.chainId)} Explorer`"
                  icon="pi pi-external-link"
                  link
                  @click="window.open(getBlockExplorerUrl(wallet.chainId, lastTxHash), '_blank')"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Contract Info -->
      <Card class="mt-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-file-code text-gray-600"></i>
            Contract Information
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-map-marker text-blue-600"></i>
                <span class="font-medium text-sm">Contract Address</span>
              </div>
              <code class="text-xs break-all">{{ config.contractAddress || 'Not configured' }}</code>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-tag text-green-600"></i>
                <span class="font-medium text-sm">Badge Token ID</span>
              </div>
              <code class="text-xs">{{ config.badgeTokenId }}</code>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-sitemap text-purple-600"></i>
                <span class="font-medium text-sm">Target Chain ID</span>
              </div>
              <code class="text-xs">{{ config.chainId }}</code>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ethers } from 'ethers'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import InlineMessage from 'primevue/inlinemessage'
import Badge from 'primevue/badge'
import Panel from 'primevue/panel'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import { CommunityBadgeABI } from './abi/communityBadge'
import { shortenAddress, isAddress, getChainName, getBlockExplorerUrl } from './utils/format'

// Configuration
const config = {
  chainId: import.meta.env.VITE_CHAIN_ID || '11155111',
  rpcUrl: import.meta.env.VITE_RPC_URL || '',
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
  badgeTokenId: import.meta.env.VITE_BADGE_TOKEN_ID || '1'
}

// Notification system
interface NotificationState {
  message: string
  type: 'success' | 'error' | 'info' | 'warn'
  visible: boolean
}

const notification = ref<NotificationState>({
  message: '',
  type: 'info',
  visible: false
})

const notify = (message: string, type: NotificationState['type'] = 'info') => {
  notification.value = {
    message,
    type,
    visible: true
  }

  setTimeout(() => {
    notification.value.visible = false
  }, 5000)
}

const hideNotification = () => {
  notification.value.visible = false
}

// Wallet state
interface WalletState {
  isConnected: boolean
  address: string
  chainId: number
  isLoading: boolean
}

const wallet = ref<WalletState>({
  isConnected: false,
  address: '',
  chainId: 0,
  isLoading: false
})

const communityLeadRole = ref<string>('')
const hasLeadRole = ref(false)
const txPending = ref(false)
const lastTxHash = ref('')

// Form data
const recipientAddress = ref('')
const revokeAddress = ref('')
const grantAddress = ref('')
const checkAddress = ref('')
const badgeCheckResult = ref<number | null>(null)
const checkingBalance = ref(false)

// Wallet functions
const getProviderAndSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  return { provider, signer }
}

const getContract = async () => {
  const { signer } = await getProviderAndSigner()
  return new ethers.Contract(
    config.contractAddress,
    CommunityBadgeABI,
    signer
  )
}

const connectWallet = async () => {
  try {
    wallet.value.isLoading = true

    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask.')
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if (accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    })

    wallet.value = {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isLoading: false
    }

    await loadCommunityLeadRole()
    await checkUserRole()

    notify('Wallet connected successfully', 'success')
  } catch (error: any) {
    wallet.value.isLoading = false
    notify(`Connection failed: ${error.message}`, 'error')
    throw error
  }
}

const switchToChain = async (targetChainId: number) => {
  try {
    const chainIdHex = `0x${targetChainId.toString(16)}`
    
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }]
    })

    wallet.value.chainId = targetChainId
    notify(`Switched to ${getChainName(targetChainId)}`, 'success')
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await addChain(targetChainId)
      } catch (addError: any) {
        notify(`Failed to add chain: ${addError.message}`, 'error')
      }
    } else {
      notify(`Failed to switch chain: ${error.message}`, 'error')
    }
  }
}

const addChain = async (chainId: number) => {
  const chainParams: any = {
    chainId: `0x${chainId.toString(16)}`,
    chainName: getChainName(chainId),
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }

  if (chainId === 11155111) {
    chainParams.rpcUrls = ['https://sepolia.infura.io/v3/']
    chainParams.blockExplorerUrls = ['https://sepolia.etherscan.io/']
  } else if (chainId === 31337) {
    chainParams.rpcUrls = ['http://127.0.0.1:8545/']
    chainParams.blockExplorerUrls = []
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [chainParams]
  })

  wallet.value.chainId = chainId
  notify(`Added and switched to ${getChainName(chainId)}`, 'success')
}

const loadCommunityLeadRole = async () => {
  try {
    const contract = await getContract()
    communityLeadRole.value = await contract.COMMUNITY_LEAD()
  } catch (error: any) {
    notify(`Failed to load role: ${error.message}`, 'error')
  }
}

const checkUserRole = async () => {
  try {
    if (!wallet.value.address || !communityLeadRole.value) return
    
    const contract = await getContract()
    hasLeadRole.value = await contract.hasRole(communityLeadRole.value, wallet.value.address)
  } catch (error: any) {
    notify(`Failed to check role: ${error.message}`, 'error')
  }
}

const award = async (to: string) => {
  try {
    if (!isAddress(to)) {
      throw new Error('Invalid address format')
    }

    txPending.value = true
    const contract = await getContract()
    const tx = await contract.award(to)
    
    lastTxHash.value = tx.hash
    notify(`Transaction submitted: ${tx.hash}`, 'info')
    
    await tx.wait()
    txPending.value = false
    
    notify('Badge awarded successfully!', 'success')
  } catch (error: any) {
    txPending.value = false
    notify(`Award failed: ${error.message}`, 'error')
    throw error
  }
}

const revoke = async (from: string) => {
  try {
    if (!isAddress(from)) {
      throw new Error('Invalid address format')
    }

    txPending.value = true
    const contract = await getContract()
    const tx = await contract.revoke(from)
    
    lastTxHash.value = tx.hash
    notify(`Transaction submitted: ${tx.hash}`, 'info')
    
    await tx.wait()
    txPending.value = false
    
    notify('Badge revoked successfully!', 'success')
  } catch (error: any) {
    txPending.value = false
    notify(`Revoke failed: ${error.message}`, 'error')
    throw error
  }
}

const grantLead = async (address: string) => {
  try {
    if (!isAddress(address)) {
      throw new Error('Invalid address format')
    }

    txPending.value = true
    const contract = await getContract()
    const tx = await contract.grantRole(communityLeadRole.value, address)
    
    lastTxHash.value = tx.hash
    notify(`Transaction submitted: ${tx.hash}`, 'info')
    
    await tx.wait()
    txPending.value = false
    
    notify('Lead role granted successfully!', 'success')
  } catch (error: any) {
    txPending.value = false
    notify(`Grant role failed: ${error.message}`, 'error')
    throw error
  }
}

const checkBadgeBalance = async (address: string): Promise<number> => {
  try {
    if (!isAddress(address)) {
      throw new Error('Invalid address format')
    }

    const contract = await getContract()
    const balance = await contract.balanceOf(address, config.badgeTokenId)
    return Number(balance)
  } catch (error: any) {
    notify(`Failed to check balance: ${error.message}`, 'error')
    return 0
  }
}

// Event handlers
const handleAward = async () => {
  try {
    await award(recipientAddress.value)
    recipientAddress.value = ''
  } catch (error) {
    // Error handled in award function
  }
}

const handleRevoke = async () => {
  try {
    await revoke(revokeAddress.value)
    revokeAddress.value = ''
  } catch (error) {
    // Error handled in revoke function
  }
}

const handleGrantLead = async () => {
  try {
    await grantLead(grantAddress.value)
    grantAddress.value = ''
  } catch (error) {
    // Error handled in grantLead function
  }
}

const handleCheckBadge = async () => {
  try {
    checkingBalance.value = true
    badgeCheckResult.value = await checkBadgeBalance(checkAddress.value)
  } catch (error) {
    // Error handled in checkBadgeBalance function
  } finally {
    checkingBalance.value = false
  }
}

// Initialize wallet state on mount
onMounted(async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        wallet.value = {
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          isLoading: false
        }
        
        await loadCommunityLeadRole()
        await checkUserRole()
      }
    } catch (error) {
      console.error('Failed to check existing connection:', error)
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', async (accounts: string[]) => {
      if (accounts.length === 0) {
        wallet.value = { isConnected: false, address: '', chainId: 0, isLoading: false }
        hasLeadRole.value = false
      } else {
        wallet.value.address = accounts[0]
        await checkUserRole()
      }
    })

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      wallet.value.chainId = parseInt(chainId, 16)
    })
  }
})
</script>