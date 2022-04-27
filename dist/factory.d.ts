import { Connector, ConnectorType } from './connectors';
export interface InitType {
    type?: ConnectorType;
    chains?: (string | number)[];
    rpcs?: {
        [key: string]: string[];
    };
}
declare class Factory {
    type: ConnectorType;
    chains: string[];
    rpcs: {
        [key: string]: string[];
    };
    connected: boolean;
    instancePool: object;
    connectedChains: {
        [key: string]: Connector;
    };
    isInitialised: boolean;
    subscribe(chainId: string, path: string, args: string[][], callback: (output: any) => void): Promise<(() => void) | null>;
    init({ type, chains, rpcs }: InitType, reInit?: boolean): Factory;
    connect({ type, chains, rpcs }: InitType, reInit?: boolean): Promise<Factory>;
    connectChains(): Promise<{
        [key: string]: Connector;
    }>;
    callChains<Output>(path: string, params: string[], format: (output: any[]) => Output): Promise<Array<Output | null>>;
    private validateChainIds;
}
export default Factory;
