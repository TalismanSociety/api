import { WsProvider } from '@polkadot/api'
import { TypeRegistry, createType } from '@polkadot/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import chaindata from '@talismn/chaindata-js'
import { decodeAnyAddress } from '@talismn/util'
import { get } from 'lodash'

import Connector from './interface'

const systemHash = '26aa394eea5630e07c48ae0c9558cef7' // util_crypto.xxhashAsHex("System", 128);
const accountHash = 'b99d880ec681799c0cf30e8886371da9' // util_crypto.xxhashAsHex("Account", 128);
const AccountInfo = JSON.stringify({
  nonce: 'u32',
  consumer: 'u32',
  providers: 'u32',
  sufficients: 'u32',
  data: {
    free: 'u128',
    reserved: 'u128',
    miscFrozen: 'u128',
    feeFrozen: 'u128',
  },
})

const registry = new TypeRegistry()
registry.register({ AccountInfo })

const pathsToEndpoints = {
  balance: {
    endpoint: `0x${systemHash}${accountHash}%s`,
    params: [String],
  },
}

export default class WsProviderConnector implements Connector {
  static type = 'WSPROVIDER' as const

  chainId: string
  rpcs: string[]
  nativeToken: string | null = null

  ws: WsProvider | undefined
  killHealthCheck: boolean = false

  constructor(chainId: string, rpcs: string[]) {
    this.chainId = chainId
    this.rpcs = rpcs

    return this
  }

  async getChainData() {
    if (!this.rpcs?.length) {
      const chain = await chaindata.chain(this.chainId)
      this.rpcs = chain.rpcs
    }

    if (!this.nativeToken) {
      const chain = await chaindata.chain(this.chainId)
      this.nativeToken = chain.nativeToken
    }

    return {
      rpcs: this.rpcs,
      nativeToken: this.nativeToken,
    }
  }

  async connect(): Promise<void> {
    if (!this.chainId) return

    await this.getChainData()

    const autoConnectMs = 1000
    this.ws = new WsProvider(this.rpcs, autoConnectMs)

    // set up healthcheck (keeps ws open when idle), don't wait for setup to complete
    ;(async () => {
      if (!this.ws) return console.warn('ignoring ws healthcheck init: this.ws is not defined')
      await this.ws.isReady

      const intervalMs = 10_000 // 10,000ms = 10s
      const intervalId = setInterval(() => {
        if (this.killHealthCheck) return clearInterval(intervalId)
        if (!this.ws) return console.warn('skipping ws healthcheck: this.ws is not defined')
        this.ws.send('system_health', [])
      }, intervalMs)
    })()

    return
  }

  async subscribe(
    path: string,
    args: string[][],
    callback: (result: { reference: string; output: any; chainId: string; nativeToken: string }) => void
  ): Promise<(() => void) | null> {
    // check connector has been set up
    if (this.chainId === null) {
      console.warn('ignoring subscription request: chainId not set')
      return null
    }
    if (!this.ws) {
      console.warn('ignoring subscription request: initialize connector with connect() before calling subscribe()')
      return null
    }

    // set up rpc parameters
    const endpoint = get(pathsToEndpoints, path).endpoint
    if (!endpoint) return null

    // set up method, return message type and params
    const method = 'state_subscribeStorage' // method we're calling
    const returnMethod = 'state_storage' // message type of the rpc's response for the method we're calling
    const params = [
      // TODO: This argument formatting is specific to System.Account, we should come up with a generic way to specify it
      args
        .map(args => decodeAnyAddress(args[0]))
        .map(addressBytes => blake2Concat(addressBytes).replace('0x', ''))
        .map(addressHash => endpoint.replace('%s', `${addressHash}`)),
    ]

    // set up function for formatting the result
    const formatChange = ([reference, change]) => ({
      chainId: this.chainId,
      nativeToken: this.nativeToken,
      reference,
      // TODO: This output formatting is specific to System.Account, we should come up with a generic way to specify it
      output: createType(registry, AccountInfo, change),
    })

    // wait for WsProvider to be connected
    await this.ws.isReady

    // set up subscription
    const subscriptionId = await this.ws.subscribe(returnMethod, method, params, (error, result) => {
      if (error) return console.error(`RPC error for chain ${this.chainId}: ${error.toString()}`)

      result?.changes?.map(formatChange).forEach(callback)
    })

    // set up unsubscribe callback
    const unsubscribe = async () => {
      if (!this.ws) return console.warn('ignoring unsubscribe request: this.ws is not defined')

      const method = 'state_unsubscribeStorage'
      return await this.ws.unsubscribe(returnMethod, method, subscriptionId)
    }

    return unsubscribe
  }

  async call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null> {
    if (!this.chainId) return null

    console.warn('WsProviderConnector.call not implemented. Try WsProviderConnector.subscribe instead!')
    return null
  }
}

function blake2Concat(input: Uint8Array): string {
  const inputHash = blake2AsHex(input, 128)
  const inputHex = [...input].map(x => x.toString(16).padStart(2, '0')).join('')

  return `${inputHash}${inputHex}`
}
