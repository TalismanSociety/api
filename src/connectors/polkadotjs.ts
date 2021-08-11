import chaindata from '@talismn/chaindata-js'
import compose from '../compose'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { options as acalaOptions } from '@acala-network/api'

class Connector{
  type: string = 'POLKADOTJS'
  id: string|null = null
  rpcs: any[] = []
  nativeToken: string|null = null
  api: ApiPromise|null = null
  query: any
  isReady: boolean = false

  constructor(id: string, rpcs: any[] = []){
    if(!id) throw new Error('Chain ID must be supplied')
    this.id = id
    this.rpcs = rpcs
  }

  async getChainData(){
    if(!this.rpcs.length) {
      const rpcResult = await chaindata.chain(this.id, 'rpcs')
      this.rpcs = rpcResult.rpcs
    }

    if(!this.nativeToken) {
      const tokenResult = await chaindata.chain(this.id, 'nativeToken')
      this.nativeToken = tokenResult.nativeToken
    }

    return {
      rpc: this.rpcs[0],
      nativeToken: this.nativeToken
    }
  }

  // todo: catch broken rpcs and try another
  async connect(){
    const { rpc } = await this.getChainData()
    const provider = new WsProvider(rpc);
    await ApiPromise.create(compose(acalaOptions)({ provider, throwOnConnect: true })).then(api => {
      this.api = api
      this.query = this.api.query
      this.isReady = true
    })

    return this
  }
}

export default Connector
