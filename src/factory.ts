import chaindata from '@talismn/chaindata-js'
import Connectors, { Connector, ConnectorType, ConnectorTypes } from './connectors'
import Subscribable from './subscribable'
import pMap from 'p-map'

const chainConcurrencyLimit = 10 // connect or fetch data from a maximum of 10 chains at a time

export interface InitType {
  type?: ConnectorType
  chains?: (string | number)[]
  rpcs?: { [key: string]: string[] }
}

class Factory extends Subscribable {
  type: ConnectorType = ConnectorTypes[0]
  chains: string[] = []
  rpcs: { [key: string]: string[] } = {}
  connected: boolean = false
  instancePool: object = {}
  connectedChains: Connector[] = []
  isInitialised = false

  async connect({ type, chains = [], rpcs = {} }: InitType, reInit = false): Promise<Factory> {
    if (this.isInitialised === true && reInit !== true) return this
    this.isInitialised = true

    if (type !== undefined) this.type = type
    this.chains = chains.map(chain => chain.toString())
    this.rpcs = rpcs

    this.connectedChains = await this.connectChains()

    return this
  }

  // init using RPCs
  async connectChains(): Promise<Connector[]> {
    return await pMap(
      await this.validateChainIds(),
      async id => {
        const Connector = Connectors[this.type]
        const instance = new Connector(id, id ? this.rpcs[id] : [])

        try {
          await instance.connect()
        } catch (error) {
          console.error(`failed to connect to chain ${id}`, error)
        }

        return instance
      },
      { concurrency: chainConcurrencyLimit }
    )
  }

  // iterate through all parachains and call endpoint
  async callChains<Output>(
    path: string,
    params: string[],
    format: (output: any[]) => Output
  ): Promise<Array<Output | null>> {
    return await pMap(
      this.connectedChains,
      async chain => {
        try {
          return await chain.call(path, params, format)
        } catch (error) {
          console.error('failed to call chain endpoint', error)
          return null
        }
      },
      { concurrency: chainConcurrencyLimit }
    )
  }

  // make sure the chains supplied by the user are valid
  // [todo] notify the user if any requested chainIds are not found
  private async validateChainIds() {
    // get all chains from chaindata lib
    const allChains = await chaindata.chains()
    const allChainIds = Object.keys(allChains)

    // cross reference against the chains the user is interested in, if any
    return this.chains.length < 1 ? allChainIds : this.chains.map(id => (allChainIds.includes(id) ? id : null))
  }
}

export default Factory
