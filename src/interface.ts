import BigNumber from 'bignumber.js'
import Factory, { InitType } from './factory'
import pMap from 'p-map'

export type Balance = {
  chainId: string
  address: string
  token: string

  total: string
  free: string
  reserved: string
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
          const format = ({ data, chainId, nativeToken }: any): Balance | null => {
            if (data === null) return null

            const balance = {
              nonce: data[0],
              index: data[1],
              free: data[2],
              locked: data[3],
              reserved: data[4],
            }

            const free = new BigNumber(balance.free.toString())
            const reserved = new BigNumber(balance.reserved.toString())
            const total = free.plus(reserved)

            return {
              chainId,
              token: nativeToken,
              address: address,

              total: total.toString(),
              free: free.toString(),
              reserved: reserved.toString(),
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
