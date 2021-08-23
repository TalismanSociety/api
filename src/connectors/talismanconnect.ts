import Connector from './interface'
import chaindata from '@talismn/chaindata-js'
import { createType, TypeRegistry } from '@polkadot/types'
import { get } from 'lodash'
import { blake2AsHex } from '@polkadot/util-crypto'
import { decodeAddress } from '@polkadot/keyring'

const systemHash = '26aa394eea5630e07c48ae0c9558cef7' // util_crypto.xxhashAsHex("System", 128);
const accountHash = 'b99d880ec681799c0cf30e8886371da9' // util_crypto.xxhashAsHex("Account", 128);
const accountTuple = { AccountInfo: '(u64, u64, u64, u64, u64)' }

const registry = new TypeRegistry()
registry.register(accountTuple)

const pathsToEndpoints = {
  balance: {
    endpoint: `0x${systemHash}${accountHash}%s`,
    params: [String],
  },
}

export default class TalismanConnect implements Connector {
  static type = 'TALISMANCONNECT' as const

  chainId: string | null
  rpcs: string[]
  nativeToken: string | null = null

  ws: WebSocket | undefined
  wsSubs: { [key: number]: (data: string | null) => void } = {}
  wsReqIndex: number = 1

  constructor(chainId: string | null, rpcs: string[]) {
    this.chainId = chainId
    this.rpcs = rpcs

    return this
  }

  async getChainData() {
    if (!this.rpcs.length) {
      const rpcResult = await chaindata.chain(this.chainId, 'rpcs')
      this.rpcs = rpcResult.rpcs
    }

    if (!this.nativeToken) {
      const tokenResult = await chaindata.chain(this.chainId, 'nativeToken')
      this.nativeToken = tokenResult.nativeToken
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

  async call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null> {
    if (!this.chainId) return null

    // TODO: Iterate through all rpcs to find one which works
    const rpc = this.rpcs[0]
    if (!rpc) throw new Error('rpc required')

    if (rpc.startsWith('wss://') || rpc.startsWith('ws://')) {
      return this._callWs(rpc, path, params, format)
    }

    if (rpc.startsWith('https://') || rpc.startsWith('http://')) {
      return this._callHttp(rpc, path, params, format)
    }

    throw new Error(`unsupported rpc protol: ${rpc}`)
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
    const addressBytes = decodeAddress(address)
    const addressHashed = blake2AsHex(addressBytes, 128).replace('0x', '')
    const addressHex = [...addressBytes].map(x => x.toString(16).padStart(2, '0')).join('')

    const method = 'state_getStorage'
    const params = [endpoint.replace('%s', `${addressHashed}${addressHex}`)]

    const output = await this._wsRpcFetch(rpc, method, params)
    const result = JSON.parse(output).result
    const decoded = createType(registry, accountTuple.AccountInfo, result)

    return format({ chainId: this.chainId, nativeToken: this.nativeToken, data: decoded })
  }

  async _callHttp<Output>(rpc: string, _path: string, _args: string[], _format: (output: any) => any): Promise<Output> {
    throw new Error(`rpc via http not yet implemented: ${rpc}`)
  }

  _wsRpcFetch(url: string, method: string, params: any[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (this.ws === undefined) await this._createSocket(url)
      if (this.ws === undefined) return reject('failed to create websocket connection')

      const id = this._nextWsReqId()
      this.wsSubs[id] = data => {
        if (data === null) return reject()
        resolve(data)
      }

      const payload = JSON.stringify({ id, jsonrpc: '2.0', method, params })
      this.ws.send(payload)
    })
  }

  _nextWsReqId(): number {
    const id = this.wsReqIndex
    this.wsReqIndex = (this.wsReqIndex + 1) % 99999
    return id
  }

  _createSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url)
      socket.onopen = () => {
        this.ws = socket
        resolve()
      }
      socket.onmessage = message => {
        const id = JSON.parse(message.data)?.id
        if (!id) {
          console.warn('ignoring ws message with no id', message)
          return
        }
        if (!this.wsSubs[id]) {
          console.warn('ignoring ws message unknown id', message)
          return
        }
        const subscription = this.wsSubs[id]
        delete this.wsSubs[id]
        subscription(message.data)
      }
      socket.onerror = reject
      socket.onclose = () => {
        this.ws = undefined
        const subscriptions = Object.values(this.wsSubs)
        this.wsSubs = {}
        subscriptions.forEach(sub => sub(null))
        reject()
      }
    })
  }
}
