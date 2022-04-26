import { WsProvider } from '@polkadot/api';
import Connector from './interface';
export default class WsProviderConnector implements Connector {
    static type: "WSPROVIDER";
    chainId: string;
    rpcs: string[];
    nativeToken: string | null;
    ws: WsProvider | undefined;
    killHealthCheck: boolean;
    constructor(chainId: string, rpcs: string[]);
    getChainData(): Promise<{
        rpcs: string[];
        nativeToken: string | null;
    }>;
    connect(): Promise<void>;
    subscribe(path: string, args: string[][], callback: (result: {
        reference: string;
        output: any;
        chainId: string;
        nativeToken: string;
    }) => void): Promise<(() => void) | null>;
    call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null>;
}
