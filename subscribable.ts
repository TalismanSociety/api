import { v4 as uuidv4 } from 'uuid';

class Subscribable {
  subscriptions: any = {}

  subscribe(type:string, cb:func=(result?:any)=>{}){
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

  triggerSubscription(type:string, data:all=null){
    Object.values(this.subscriptions).forEach(sub => {
      if(sub[0] === type) sub[1](data)
    })
  }
}

export default Subscribable