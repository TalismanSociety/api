>
> This repo is no longer maintained.
>
> Talisman's token balance support is now part of the `@talismn/balances` collection of packages.
>
> The source code for these packages can be found in the `packages` directory of the [Talisman monorepo](https://github.com/talismansociety/talisman).
>

# @talismn/api

<img src="1f9ff.svg" alt="Talisman" width="15%" align="right" />

[![license](https://img.shields.io/github/license/talismansociety/api?style=flat-square)](https://github.com/TalismanSociety/api/blob/master/LICENCE)
[![npm-version](https://img.shields.io/npm/v/@talismn/api?style=flat-square)](https://www.npmjs.com/package/@talismn/api)
[![npm-downloads](https://img.shields.io/npm/dw/@talismn/api?style=flat-square)](https://www.npmjs.com/package/@talismn/api)
[![discord-link](https://img.shields.io/discord/858891448271634473?logo=discord&logoColor=white&style=flat-square)](https://discord.gg/rQgTD9SGtU)

**A package for doing fast analysis across multiple DotSama chains at once.**

At a high level, `@talismn/api` is a factory library which you can use to perform queries across many DotSama parachains. These queries are executed in parallel and their results are combined into a useful output.

This library can be made to fetch data via one of three connector types:

1. `TalismanConnect` - our super lightweight RPC client designed to query potentially hundreds of parachains as fast and efficiently as possible ⚡
2. `PolkadotJs` - the [full featured RPC client](https://github.com/polkadot-js/api) from [@paritytech](https://github.com/paritytech)
3. [TODO] `Lightclient` - spin up a (light) node and talk straight to the parachain networks

By default this library uses the community-defined chain RPCs and lightclient chainspecs at [TalismanSociety/chaindata](https://github.com/TalismanSociety/chaindata), but can also be used with custom RPCs/chainspecs if needed.

The goals of this library are to:

1. Allow developers to perform the same action across multiple chains (e.g. get account balances)
2. Allow developers to discover chain capabilities (i.e. what pallets they may have)
3. Provide developers with easy access to often-sought data located across multiple chains (all the balances!)

In the future, we would like to:

- [ ] Add parachain pallet discovery and introspection
- [ ] Add more aggregated information endpoints to accompany the `balances` endpoint (e.g. crowdloans, crowdloan contributions, bonded funds, etc)
- [ ] Decouple incoming calls to `balances`/`subscribeBalances` from outgoing RPC requests (add a cache which is shared between api calls, use RPC to fill cache rather than to directly respond to api request)

## Usage

Please note: while we work towards a v1.0 release, the public interface is subject to change.

#### Import api

```ts
import Talisman from '@talismn/api'
```

> note: `Talisman` is a singleton

#### Make a one-off call to balances

```ts
// Connect to the chain RPCs
await Talisman.connect({ chains: [0, 2, 2000] })

// Fetch balances
await Talisman.balances(['0x000...', '0x000...'])

// Will output an array of balances:
//
// [{
//   chainId: '0',
//   address: '0x000...',
//   token: 'DOT',
//
//   total: '10000000000000',
//   free: '10000000000000',
//   reserved: '0',
//   miscFrozen: '0',
//   feeFrozen: '0',
// }]
```

> note: `Talisman.connect` is only required if not using subscriptions

#### Subscribe to balances

```ts
// Initialize the singleton
Talisman.init()

// Subscribe to balances
const unsubscribe = Talisman.subscribeBalances(
  [0, 2, 2000], // chains
  ['0x000...', '0x000...'], // addresses
  (balance) => console.log(balance)
)

// Will output all account balanaces once, then future balance changes as they happen:
//
// {
//   chainId: '0',
//   address: '0x000...',
//   token: 'DOT',
//
//   total: '10000000000000',
//   free: '10000000000000',
//   reserved: '0',
//   miscFrozen: '0',
//   feeFrozen: '0',
// }

// (later) Unsubscribe from future balances
unsubscribe()
```
