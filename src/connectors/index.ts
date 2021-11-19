import _Connector, { ConnectorConstructor } from './interface'
import Lightclient from './lightclient'
import PolkadotJs from './polkadotjs'
import TalismanConnect from './talismanconnect'
import WsProvider from './wsprovider'

export type Connector = _Connector

export const ConnectorTypes = [PolkadotJs.type, TalismanConnect.type, Lightclient.type, WsProvider.type]
export type ConnectorType = typeof ConnectorTypes[number]

const Connectors: { [key in ConnectorType]: ConnectorConstructor } = {
  [TalismanConnect.type]: TalismanConnect,
  [Lightclient.type]: Lightclient,
  [PolkadotJs.type]: PolkadotJs,
  [WsProvider.type]: WsProvider,
}

export default Connectors
