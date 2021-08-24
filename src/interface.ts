import BigNumber from 'bignumber.js'
import pMap from 'p-map'

import Factory, { InitType } from './factory'

export type Balance = {
  chainId: string
  address: string
  token: string

  total: string
  free: string
  reserved: string
  miscFrozen: string
  feeFrozen: string
}

// request a maximum of 2 queries at a time
// number of outgoing connections = number of chains * number of requests
// e.g. for 10 chains:
//   2 requests * 10 chains = 20 outgoing connections
//   5 requests * 10 chains = 50 outgoing connections
const requestConcurrencyLimit = 2

class Interface {
  factory: Factory | null = null

  // set the factory to be used
  setFactory(factory: Factory) {
    this.factory = factory
  }

  // mappings
  async connect(props: InitType): Promise<Interface> {
    if (!this.factory) throw new Error('failed to connect: no factory set')
    await this.factory.connect(props)
    return this
  }

  // iterate through addresses & get chainfactory data
  // [todo] could return a balance type/object with filtering/ordering/cutting options?
  async balance(addresses: string[] | string = []): Promise<Array<Balance>> {
    return (
      await pMap(
        typeof addresses === 'string' ? [addresses] : addresses,
        async address => {
          const path = 'balance'
          const format = ({ output, chainId, nativeToken }: any): Balance | null => {
            if (output === null) return null

            const free = new BigNumber(output.data?.free.toString() || '0')
            const reserved = new BigNumber(output.data?.reserved.toString() || '0')
            const miscFrozen = new BigNumber(output.data?.miscFrozen.toString() || '0')
            const feeFrozen = new BigNumber(output.data?.feeFrozen.toString() || '0')
            const total = free.plus(reserved)

            return {
              chainId,
              token: nativeToken,
              address: address,

              total: total.toString(),
              free: free.toString(),
              reserved: reserved.toString(),
              miscFrozen: miscFrozen.toString(),
              feeFrozen: feeFrozen.toString(),
            }
          }

          if (!this.factory) throw new Error('failed to get balance: no factory set')
          try {
            return await this.factory.callChains(path, [address], format)
          } catch (error) {
            console.error(`failed to get balances for address ${address}`, error)
            return []
          }
        },
        { concurrency: requestConcurrencyLimit }
      )
    )
      .flatMap(balances => balances)
      .filter((balance): balance is Balance => balance !== null)
  }
}

export default Interface
