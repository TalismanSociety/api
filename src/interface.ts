import BN from 'bn.js'
import Factory from './factory'

const mappings = {
  balance: {
    mapping: 'query.system.account',
    params: [String, Object]
  }
}

class Interface{

  factory: Factory|null = null

  // set the factory to be used
  setFactory(factory: Factory){
    this.factory = factory
  }

  // mappings
  async connect(props){
    if (!this.factory) throw new Error('failed to connect: no factory set')
    await this.factory.connect(props)
    return this
  }

  // iterate through addresses & get chainfactory data
  // [todo] could return a balance type/object with filtering/ordering/cutting options?
  async balance(addresses: string[]|string = []){
    
    addresses = typeof addresses === 'string' ? [addresses] : addresses
  const balances: any = []

    for (let i = 0; i < addresses.length; i++) {
      const result = await this.resolveMapping('balance', addresses[i])

      const mapped = result.map(result => {
        if (result === null) return {}

        const {balance, chain} = result

        const free = new BN(balance.free.toString())
        const reserved = new BN(balance.reserved.toString())
        const total = free.add(reserved)

        return {
          address: addresses[i],
          chainId: chain.id,
          token: chain.nativeToken,
          total: total.toString(),
          free: free.toString(),
          reserved: reserved.toString(),
        }
      })

      balances.push(...mapped)
    }

    // group by address
    balances.byAddress = () => {
      const formatted = {}
      balances.forEach(item => {
        if(!formatted[item.address]) { formatted[item.address] = []}
        formatted[item.address].push(item)
      })
      return formatted
    }

    // group by chain
    balances.byChain = () => {
      const formatted = {}
      balances.forEach(item => {
        if(!formatted[item.chainId]) { formatted[item.chainId] = []}
        formatted[item.chainId].push(item)
      })
      return formatted
    }

    return balances
  }


  async resolveMapping(key, address){
    if (!this.factory) throw new Error('failed to resolveMapping: no factory set')
    const mapping = mappings[key].mapping
    return await this.factory.call(mapping, address)
  }
}

export default Interface
