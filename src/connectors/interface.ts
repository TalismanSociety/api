export interface ConnectorConstructor {
  new (chainId: string, rpcs: string[]): Connector
}

export default interface Connector {
  connect(): Promise<void>

  subscribe(
    path: string,
    args: string[][],
    callback: (result: { reference: string; output: any; chainId: string; nativeToken: string }) => void
  ): Promise<(() => void) | null>

  call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null>
}
