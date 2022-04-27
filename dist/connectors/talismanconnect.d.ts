import Connector from './interface';
export default class TalismanConnect implements Connector {
    static type: "TALISMANCONNECT";
    chainId: string;
    rpcs: string[];
    nativeToken: string | null;
    ws: WebSocket | undefined;
    wsCreated: false | Promise<void>;
    wsHandlers: {
        [key: number]: (data: string | null) => void;
    };
    wsNextHandlerId: number;
    wsSubscriptions: {
        [key: string]: (output: any) => void;
    };
    wsLatestUnhandledSubscriptionData: {
        [key: string]: any;
    };
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
    _callWs<Output>(rpc: string, path: string, args: string[], format: (output: any) => any): Promise<Output | null>;
    _callHttp<Output>(rpc: string, _path: string, _args: string[], _format: (output: any) => any): Promise<Output>;
    _wsRpcFetch(url: string, method: string, params: any[]): Promise<string>;
    _nextWsHandlerId(): number;
    _createSocket(url: string): Promise<void>;
}
