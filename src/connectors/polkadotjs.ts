import { options as acalaOptions } from '@acala-network/api'
import { ApiPromise, WsProvider } from '@polkadot/api'
import chaindata from '@talismn/chaindata-js'
import { get } from 'lodash'

import compose from '../compose'
import Connector from './interface'

const pathsToEndpoints = {
  balance: {
    endpoint: 'query.system.account',
  },
}

export default class PolkadotJs implements Connector {
  static type = 'POLKADOTJS' as const

  chainId: string | null = null
  rpcs: string[] = []
  nativeToken: string | null = null

  api: ApiPromise | null = null

  constructor(chainId: string | null, rpcs: string[] = []) {
    this.chainId = chainId
    this.rpcs = rpcs
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

  async connect() {
    if (!this.chainId) return

    const { rpcs } = await this.getChainData()
    const provider = new WsProvider(rpcs)
    await ApiPromise.create(compose(acalaOptions as any)({ provider, throwOnConnect: true })).then(api => {
      this.api = api
    })

    return
  }

  async call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null> {
    if (!this.chainId) return null
    if (!this.api) throw new Error(`chain ${this.chainId} not ready`)

    const endpoint = get(pathsToEndpoints, path).endpoint
    if (!endpoint) return null

    const output = await get(this.api, endpoint)(...params)
    return format({ chainId: this.chainId, nativeToken: this.nativeToken, output })
  }
}
