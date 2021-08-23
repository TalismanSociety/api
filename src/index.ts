import Interface from './interface'
import Factory from './factory'

export type { Balance } from './interface'

const InterfaceInstance = new Interface()
const FactoryInstance = new Factory()

InterfaceInstance.setFactory(FactoryInstance)

export default InterfaceInstance
