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

export default class TalismanConnect implements Connector {
  static type = 'TALISMANCONNECT' as const

  chainId: string
  rpcs: string[]
  nativeToken: string | null = null

  ws: WebSocket | undefined
  wsCreated: false | Promise<void> = false
  wsHandlers: { [key: number]: (data: string | null) => void } = {}
  wsNextHandlerId: number = 1
  wsSubscriptions: { [key: string]: (output: any) => void } = {}

  // Sometimes when we subscribe to some data, we receive the data before we receive the subscription id.
  // For example:
  //
  // Outgoing -> {"id":1,"jsonrpc":"2.0","method":"state_subscribeStorage","params":[["<data>"]]}
  // Incoming <- {"jsonrpc":"2.0","method":"state_storage","params":{"result":{"block":"<hash>","changes":[["<data>","<data>"]]},"subscription":"Xdi30rwJSV2vTDly"}}
  // Incoming <- {"jsonrpc":"2.0","result":"Xdi30rwJSV2vTDly","id":1}
  //
  // Because we haven't yet registered a callback for the subscription result, the first set of data is lost.
  // To fix this, we cache the most recently received data for each subscription id which doesn't yet have a handler.
  // When registering a new handler, we check if it has any data waiting in this cache and immediately send it through if so.
  //
  wsLatestUnhandledSubscriptionData: { [key: string]: any } = {}

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

    return
  }

  async subscribe(
    path: string,
    args: string[][],
    callback: (result: { reference: string; output: any; chainId: string; nativeToken: string }) => void
  ): Promise<(() => void) | null> {
    if (this.chainId === null) {
      console.warn('ignoring subscription request: chainId not set')
      return null
    }

    for (const rpc of this.rpcs) {
      try {
        if (!rpc) throw new Error('failed to create subscription: rpc required')

        if (!rpc.startsWith('wss://') && !rpc.startsWith('ws://')) {
          throw new Error('failed to create subscription: ws or wss rpc protocol required')
        }

        const endpoint = get(pathsToEndpoints, path).endpoint
        if (!endpoint) return null

        const method = 'state_subscribeStorage'
        const params = [
          // TODO: This argument formatting is specific to System.Account, we should come up with a generic way to specify it
          args
            .map(args => decodeAnyAddress(args[0]))
            .map(addressBytes => blake2Concat(addressBytes).replace('0x', ''))
            .map(addressHash => endpoint.replace('%s', `${addressHash}`)),
        ]

        const response = await this._wsRpcFetch(rpc, method, params)
        const result = JSON.parse(response).result
        const subscriptionId = result

        this.wsSubscriptions[subscriptionId] = callback

        if (this.wsLatestUnhandledSubscriptionData[subscriptionId]) {
          this.wsLatestUnhandledSubscriptionData[subscriptionId].forEach(callback)
          delete this.wsLatestUnhandledSubscriptionData[subscriptionId]
        }

        const unsubscribe = async () => {
          const method = 'state_unsubscribeStorage'
          const params = [subscriptionId]

          const response = await this._wsRpcFetch(rpc, method, params)
          const result = JSON.parse(response).result

          return result
        }

        return unsubscribe
      } catch (error) {
        console.error(`Failed rpc subscription via ${rpc}`, error)
        continue
      }
    }

    throw new Error(`Failed rpc subscription via all rpcs for chain ${this.chainId} callpath ${path}`)
  }

  async call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null> {
    if (!this.chainId) return null

    for (const rpc of this.rpcs) {
      try {
        if (!rpc) throw new Error('rpc required')

        if (rpc.startsWith('wss://') || rpc.startsWith('ws://')) {
          return this._callWs(rpc, path, params, format)
        }

        if (rpc.startsWith('https://') || rpc.startsWith('http://')) {
          return this._callHttp(rpc, path, params, format)
        }

        console.warn('TalismanConnect.call not implemented. Try TalismanConnect.subscribe instead!')
        return null
      } catch (error) {
        console.error(`Failed rpc call via ${rpc}`, error)
        continue
      }
    }

    throw new Error(`Failed rpc call via all rpcs for chain ${this.chainId} callpath ${path}`)
  }

  async _callWs<Output>(
    rpc: string,
    path: string,
    args: string[],
    format: (output: any) => any
  ): Promise<Output | null> {
    // TODO: This formatting of args is specific to the balances endpoint
    //       We should come up with a generic way to specify it

    const endpoint = get(pathsToEndpoints, path).endpoint
    if (!endpoint) return null

    const address = args[0]
    const addressBytes = decodeAnyAddress(address)
    const addressHash = blake2Concat(addressBytes).replace('0x', '')

    const method = 'state_getStorage'
    const params = [endpoint.replace('%s', `${addressHash}`)]

    const response = await this._wsRpcFetch(rpc, method, params)
    const result = JSON.parse(response).result
    const output = createType(registry, AccountInfo, result)

    return format({ chainId: this.chainId, nativeToken: this.nativeToken, output })
  }

  async _callHttp<Output>(rpc: string, _path: string, _args: string[], _format: (output: any) => any): Promise<Output> {
    throw new Error(`rpc via http not yet implemented: ${rpc}`)
  }

  _wsRpcFetch(url: string, method: string, params: any[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!this.wsCreated) this.wsCreated = this._createSocket(url)

      try {
        await this.wsCreated
      } catch (error) {
        this.wsCreated = false
        reject(error)
      }

      if (this.ws === undefined) return reject('failed to create websocket connection')

      const id = this._nextWsHandlerId()
      this.wsHandlers[id] = data => {
        if (data === null) return reject()
        resolve(data)
      }

      const payload = JSON.stringify({ id, jsonrpc: '2.0', method, params })
      this.ws.send(payload)
    })
  }

  _nextWsHandlerId(): number {
    const id = this.wsNextHandlerId
    this.wsNextHandlerId = (this.wsNextHandlerId + 1) % 999999
    return id
  }

  _createSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url)

      let skipHealthCheck = true
      const keepaliveInterval = 10000
      const healthcheck = setInterval(() => {
        // TODO: Reconnect on failure
        !skipHealthCheck && this._wsRpcFetch(url, 'system_health', [])
      }, keepaliveInterval)

      socket.onopen = () => {
        this.ws = socket
        skipHealthCheck = false
        resolve()
      }
      socket.onmessage = message => {
        const data = JSON.parse(message.data)
        const isSubscriptionUpdate = data.method !== undefined && typeof data.params.subscription === 'string'

        if (isSubscriptionUpdate) {
          const subscriptionId = data.params.subscription
          const formatChange = ([reference, change]) => ({
            chainId: this.chainId,
            nativeToken: this.nativeToken,
            reference,
            // TODO: This output formatting is specific to System.Account, we should come up with a generic way to specify it
            output: createType(registry, AccountInfo, change),
          })

          const handler = this.wsSubscriptions[subscriptionId]
          if (!handler) {
            console.warn(
              `caching result for subscription ${subscriptionId}: no handler registered for this subscription id`
            )
            this.wsLatestUnhandledSubscriptionData[subscriptionId] = data.params.result.changes.map(formatChange)
            return
          }

          data.params.result.changes.map(formatChange).forEach(handler)

          return
        }

        const id = JSON.parse(message.data)?.id
        if (!id) {
          console.warn('ignoring ws message with no id', data)
          return
        }
        if (!this.wsHandlers[id]) {
          console.warn('ignoring ws message with unknown id', data)
          return
        }
        const handler = this.wsHandlers[id]
        delete this.wsHandlers[id]
        handler(message.data)
      }
      socket.onerror = reject
      socket.onclose = () => {
        clearInterval(healthcheck)

        this.ws = undefined
        this.wsCreated = false

        const handlers = Object.values(this.wsHandlers)
        this.wsHandlers = {}
        handlers.forEach(handler => handler(null))

        this.wsSubscriptions = {}

        reject()
      }
    })
  }
}

function blake2Concat(input: Uint8Array): string {
  const inputHash = blake2AsHex(input, 128)
  const inputHex = [...input].map(x => x.toString(16).padStart(2, '0')).join('')

  return `${inputHash}${inputHex}`
}
