export interface ConnectorConstructor {
  new (chainId: string | null, rpcs: string[]): Connector
}

export default interface Connector {
  connect(): Promise<void>

  subscribe(path: string, args: string[][], callback: (output: any) => void): Promise<(() => void) | null>

  call<Output>(path: string, params: string[], format: (output: any) => Output): Promise<Output | null>
}
