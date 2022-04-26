import Factory from '../dist/factory'
import Interface from '../dist/interface'

export type { Balance } from '../dist/interface'

const InterfaceInstance = new Interface()
const FactoryInstance = new Factory()

InterfaceInstance.setFactory(FactoryInstance)

export default InterfaceInstance
