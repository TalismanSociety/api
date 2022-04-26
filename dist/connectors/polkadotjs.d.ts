import { ApiPromise } from '@polkadot/api';
import Connector from './interface';
export default class PolkadotJs implements Connector {
    static type: "POLKADOTJS";
    chainId: string;
    rpcs: string[];
    nativeToken: string | null;
    api: ApiPromise | null;
    constructor(chainId: string, rpcs?: string[]);
    getChainData(): Promise<{
        rpcs: string[];
        nativeToken: string | null;
    }>;
    connect(): Promise<void>;
    subscribe(_path: string, _args: string[][], _callback: (result: {
        reference: string;
        output: any;
        chainId: string;
        nativeToken: string;
    }) => void): Promise<(() => void) | null>;
    call<Output>(path: string, args: string[], format: (output: any) => Output): Promise<Output | null>;
}
