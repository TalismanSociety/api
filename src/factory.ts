import chaindata from '../../chaindata-js'
import { PolkadotJs } from './connectors'
import Subscribable from './subscribable'
import { get } from 'lodash'

export const options: { [key: string]: string } = {
  POLKADOT: 'POLKADOT', // using polkadot.js 
  TALISMAN: 'TALISMAN', // using talisman.js
  LIGHT: 'LIGHT' // using lightclients
}

interface InitType {
  chains?: (string|number)[],
  rpcs?: any[],
  type?: string
}

class Factory extends Subscribable{

  type: string = Object.keys(options)[0]
  chains: string[] = []
  rpcs: any[] = []
  customRPCs: string[] = []
  connected: boolean = false
  instancePool: object = {}
  connectedChains: any[] = []
  isInitialised = false

  async connect({type=options.POLKADOT, chains=[], rpcs=[]}: InitType, reInit=false){
    if(this.isInitialised === true && reInit !== true) return this.connectedChains
    this.isInitialised = true

    // set 
    this.type = Object.keys(options).includes(type) ? type : Object.keys(options)[0]
    this.chains = chains.map(chain => chain.toString())
    this.rpcs = rpcs

    switch (this.type) {
      case 'POLKADOT':
        this.connectedChains = await this._connectWithPolkadotJs()
        break;
      case 'TALISMAN':
        this.connectedChains = await this._connectWithTalismanJs()
        break;
      case 'LIGHT':
        this.connectedChains = await this._connectWithLightclients()
        break;
      default: break;
    }

    return this
  }


  // make sure the chains supplied by the user are valid
  // [todo] notify the user if any requested chainIds are not found
  async validateChainIds(){
    // get all chains from chaindata lib
    const allChains = await chaindata.chains()

    // cross reference against the chains the user is interested in, if any
    const chainIds = this.chains.length <= 0
      ? Object.values(Object.keys(allChains))
      : this.chains.filter(id => Object.keys(allChains).includes(id) ? id : null)

    // no chains?
    // do we need this?
    if(!chainIds.length) 
      throw new Error(`No chains with the supplied IDs found: ${this.chains.join(', ')}`)

    return chainIds
  }

  // init using RPCs
  async _connectWithPolkadotJs(): Promise<any[]> {
    const chainIds = await this.validateChainIds()

    // init all instances
    const chains = await Promise.all(
      chainIds.map(async id => {
        const instance = new PolkadotJs(id, this.rpcs[id])
        await instance.connect()
        return instance
      }
    ))

    return chains
  }

  async _connectWithTalismanJs(): Promise<any[]> {
    // todo
    return []
  }

  // init using lightclients
  async _connectWithLightclients(): Promise<any[]> {
    // todo
    return []
  }

  // iterate through all parachains and 
  async call(path, params){
    const results: {balance: any, chain: any}[] = []
    for (let i = 0; i < this.connectedChains.length; i++) {
      const result = await get(this.connectedChains[i], path)(params).then(r=>r)
      results.push({
        balance: result.data, 
        chain: this.connectedChains[i] 
      })
    }

    return results
  }

}

export default Factory
