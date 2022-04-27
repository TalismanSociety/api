import _Connector, { ConnectorConstructor } from './interface';
export declare type Connector = _Connector;
export declare const ConnectorTypes: ("LIGHTCLIENT" | "POLKADOTJS" | "TALISMANCONNECT" | "WSPROVIDER")[];
export declare type ConnectorType = typeof ConnectorTypes[number];
declare const Connectors: {
    [key in ConnectorType]: ConnectorConstructor;
};
export default Connectors;
