import Factory from './factory'
import Interface from './interface'

export type { Balance } from './interface'

const InterfaceInstance = new Interface()
const FactoryInstance = new Factory()

InterfaceInstance.setFactory(FactoryInstance)

export default InterfaceInstance
