const mappings = {
  balance: {
    mapping: 'query.system.account',
    params: [String, Object]
  }
}

class Interface{

  factory: null|object = null

  // set the factory to be used
  setFactory(factory: Factory){
    this.factory = factory
  }

  // mappings
  async connect(props){
    await this.factory.connect(props)
    return this
  }

  // iterate through addresses & get chainfactory data
  // [todo] could return a balance type/object with filtering/ordering/cutting options?
  async balance(addresses: array|string = []){
    
    addresses = typeof addresses === 'string' ? [addresses] : addresses
    const balances = []

    for (let i = 0; i < addresses.length; i++) {
      const result = await this.resolveMapping('balance', addresses[i])

      const mapped = result.map(({balance, chain}) => {
        const total = balance.free.toString()
        const reserve = "1" 
        const available = (+total - +reserve <= 0 ? 0 : +total - +reserve).toString()

        return {
          address: addresses[i],
          chainId: chain.id,
          token: chain.nativeToken,
          total,
          reserve,
          available
        }
      })

      balances.push(...mapped)
    }

    // group by address
    balances.byAddress = () => {
      const formatted = {}
      balances.forEach(item => {
        if(!formatted[address]) { formatted[address] = []}
        formatted[address].push(item)
      })
      return formatted
    }

    // group by chain
    balances.byChain = () => {
      const formatted = {}
      balances.forEach(item => {
        if(!formatted[chainId]) { formatted[chainId] = []}
        formatted[chainId].push(item)
      })
      return formatted
    }

    return balances
  }


  async resolveMapping(key, address){
    const mapping = mappings[key].mapping
    return await this.factory.call(mapping, address)
  }
}

export default Interface