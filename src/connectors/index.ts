import _Connector, { ConnectorConstructor } from './interface'
import PolkadotJs from './polkadotjs'
import TalismanConnect from './talismanconnect'
import Lightclient from './lightclient'

export type Connector = _Connector

export const ConnectorTypes = [PolkadotJs.type, TalismanConnect.type, Lightclient.type]
export type ConnectorType = typeof ConnectorTypes[number]

const Connectors: { [key in ConnectorType]: ConnectorConstructor } = {
  [PolkadotJs.type]: PolkadotJs,
  [TalismanConnect.type]: TalismanConnect,
  [Lightclient.type]: Lightclient,
}

export default Connectors
