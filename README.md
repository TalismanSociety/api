# @talisman/chainfactory
**A package for spinning up a set of endpoints for doing analysis over multiple chains at once.**

@talisman/chainfactory is a factory lib for instantiating multiple polkadot.js or lightclient instances and being able to perform aggregate queries over all endpoints.

The lib can be instantiated using one or may chains (by chain id), have the option to use RPCs or light clients [<-- wip], and allow a way to provide custom RPCs or light-client chainspecs.

The goals of this repo are:

1. Allow developers to perform the same action across multiple chains (i.e get balance)
2. Allow developers to discover chain capabilities (i.e. what pallets they may have)
3. Abstract away the annoyances with spinning up multiple instances of polkadot.js

Would like to do:

1. replace polkadot.js with a super lightweight RPC connector for balance and pallet discovery

----
>** ~~~~~ WIP WIP WIP WIP WIP ~~~~~~ **
----

## Usage
Initial interface / exposed methods.

#### Import chainfactory
```js
import ChainFactory from '@talisman/chainfactory'
```

#### Init singleton/factory

```js
ChainFactory.init({chains: [0,2,2000]})
```

>note 1: should fire error if already init'ted  
>note 2: can force reinit if needed with `ChainFactory.init({chains: [0,2,2000]}, true)`  
>note 3: is a singleton pattern

#### Use instance 

```js
ChainFactory.query('system.account', [address])
```

This iterates over all instances and, using all addresses provided, calls the same api endpoint with each address

>note 1: this approach is a wip and may change depending on unknowns  
>note 2: Could look into refining this, as the **combinatorial explosion** resulting from N addresses x N chains may be slow. Something to think about and potentially resolve by creating a super lightweight rpc connector  
>note 3: The API layer (above this) will probably have convenience mappings for ease of use 

----

## Params


```json5
{
  "chains": [], // array of chain IDs to spin up (names could also work?). if empty will spin up all available.
  "rpcs": {}, // object containing chainId:RPC pairs. value can be string or array.
  "custodial": false // if !== true use polkadot.js via RPC, otherwise use wasm light client instances
}
```

>note: all params optional

----

## Rando notes:


API
  - wrapper to make API calls better
  - instead of aaa.bbb.ccc.sss.balanceSomethingBs(address), make it api.balances([address])

FACTORY
  - rpcfactory
  - lcfactory

should be able to trigger the same endpoint call simultaneously on multiple instances of the API

Future: should know about pallets and be able to use them 