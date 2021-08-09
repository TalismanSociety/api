import { v4 as uuidv4 } from 'uuid';

class Subscribable {
  subscriptions: {[key: string]: any} = {}

  subscribe(type:string, cb:() => void=(result?:any)=>{}){
    const id = uuidv4()
    this.subscriptions[id] = [type, cb]
    return () => this.unsubscribe(id)
  }

  unsubscribe(id:string){
    delete this.subscriptions[id]
  }

  unsubscribeAll(){
    this.subscriptions = {}
  }

  triggerSubscription(type:string, data:any=null){
    Object.values(this.subscriptions).forEach(sub => {
      if(sub[0] === type) sub[1](data)
    })
  }
}

export default Subscribable
