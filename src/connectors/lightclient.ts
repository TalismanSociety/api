import Connector from './interface'

export default class LightClient implements Connector {
  static type = 'LIGHTCLIENT' as const

  chainId: string
  rpcs: string[]

  constructor(chainId: string, rpcs: string[]) {
    this.chainId = chainId
    this.rpcs = rpcs

    return this
  }

  async connect(): Promise<void> {
    throw new Error('lightclient connector not yet implemented')
  }

  async subscribe(
    _path: string,
    _args: string[][],
    _callback: (result: { reference: string; output: any; chainId: string; nativeToken: string }) => void
  ): Promise<(() => void) | null> {
    throw new Error('subscribe not yet implemented')
  }

  async call<Output>(_path: string, _params: string[], _format: (output: any) => Output): Promise<Output | null> {
    throw new Error(`call not yet implemented`)
  }
}
