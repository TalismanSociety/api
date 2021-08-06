import chaindata from '../../chaindata-js'
import { ApiPromise, WsProvider } from '@polkadot/api';

class Connector{
  type: string = 'POLKADOTJS'
  id: string|null = null
  rpcs: array = []
  nativeToken: string = null
  api: ApiPromise|null = null
  isReady: boolean = false

  constructor(id: string, rpcs: array = []){
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
    await ApiPromise.create({ provider }).then(api => {
      this.api = api
      this.query = this.api.query
      this.isReady = true
    })

    return this
  }
}

export default Connector