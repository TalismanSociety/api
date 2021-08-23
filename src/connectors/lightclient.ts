import Connector from './interface'

export default class LightClient implements Connector {
  static type = 'LIGHTCLIENT' as const

  chainId: string | null
  rpcs: string[]

  constructor(chainId: string | null, rpcs: string[]) {
    this.chainId = chainId
    this.rpcs = rpcs

    return this
  }

  async connect(): Promise<void> {
    throw new Error('lightclient connector not yet implemented')
  }

  async call<Output>(_path: string, _params: string[], _format: (output: any) => Output): Promise<Output | null> {
    throw new Error(`call not yet implemented`)
  }
}
