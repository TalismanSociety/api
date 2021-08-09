import Interface from './interface'
import Factory from './factory'

const InterfaceInstance = new Interface()
const FactoryInstance = new Factory()

InterfaceInstance.setFactory(FactoryInstance)

export default InterfaceInstance