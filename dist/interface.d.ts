import Factory, { InitType } from './factory';
export declare type Balance = {
    chainId: string;
    address: string;
    token: string;
    total: string;
    free: string;
    reserved: string;
    miscFrozen: string;
    feeFrozen: string;
};
declare class Interface {
    factory: Factory | null;
    setFactory(factory: Factory): void;
    init(props: InitType): Interface;
    connect(props: InitType): Promise<Interface>;
    subscribeBalances(chainIds: string[] | undefined, addresses: string[] | undefined, callback: (balance: Balance | null, chainId: string, address: string) => void): () => void;
    balances(addresses?: string[] | string): Promise<Array<Balance>>;
}
export default Interface;
