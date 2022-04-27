import Connector from './interface';
export default class LightClient implements Connector {
    static type: "LIGHTCLIENT";
    chainId: string;
    rpcs: string[];
    constructor(chainId: string, rpcs: string[]);
    connect(): Promise<void>;
    subscribe(_path: string, _args: string[][], _callback: (result: {
        reference: string;
        output: any;
        chainId: string;
        nativeToken: string;
    }) => void): Promise<(() => void) | null>;
    call<Output>(_path: string, _params: string[], _format: (output: any) => Output): Promise<Output | null>;
}
