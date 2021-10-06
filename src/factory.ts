import chaindata from '@talismn/chaindata-js'
import pMap from 'p-map'

import Connectors, { Connector, ConnectorType, ConnectorTypes } from './connectors'

const chainConcurrencyLimit = 10 // connect or fetch data from a maximum of 10 chains at a time

export interface InitType {
  type?: ConnectorType
  chains?: (string | number)[]
  rpcs?: { [key: string]: string[] }
}

class Factory {
  type: ConnectorType = ConnectorTypes[0]
  chains: string[] = []
  rpcs: { [key: string]: string[] } = {}
  connected: boolean = false
  instancePool: object = {}
  connectedChains: { [key: string]: Connector } = {}
  isInitialised = false

  async subscribe(
    chainId: string,
    path: string,
    args: string[][],
    callback: (output: any) => void
  ): Promise<(() => void) | null> {
    if (!this.connectedChains[chainId]) {
      const Connector = Connectors[this.type]
      this.connectedChains[chainId] = new Connector(chainId, chainId ? this.rpcs[chainId] : [])
    }

    const connector = this.connectedChains[chainId]
    try {
      await connector.connect()
    } catch (error) {
      console.error(`failed to connect to chain ${chainId}`, error)
      return null
    }

    try {
      return connector.subscribe(path, args, callback)
    } catch (error) {
      console.error('failed to subscribe to chain endpoint', error)
      return null
    }
  }

  init({ type, chains = [], rpcs = {} }: InitType, reInit = false): Factory {
    if (this.isInitialised === true && reInit !== true) return this
    this.isInitialised = true

    if (type !== undefined) this.type = type
    this.chains = chains.map(chain => chain.toString())
    this.rpcs = rpcs

    return this
  }

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
  async connectChains(): Promise<{ [key: string]: Connector }> {
    return Object.fromEntries(
      await pMap(
        await this.validateChainIds(),
        async id => {
          if (id === null) return [id]

          const Connector = Connectors[this.type]
          const instance = new Connector(id, id ? this.rpcs[id] : [])

          try {
            await instance.connect()
          } catch (error) {
            console.error(`failed to connect to chain ${id}`, error)
          }

          return [id, instance]
        },
        { concurrency: chainConcurrencyLimit }
      )
    )
  }

  // iterate through all parachains and call endpoint
  async callChains<Output>(
    path: string,
    params: string[],
    format: (output: any[]) => Output
  ): Promise<Array<Output | null>> {
    return await pMap(
      Object.values(this.connectedChains),
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
