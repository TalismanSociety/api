var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
__export(exports, {
  default: () => TalismanConnect
});
var import_types = __toModule(require("@polkadot/types"));
var import_util_crypto = __toModule(require("@polkadot/util-crypto"));
var import_chaindata_js = __toModule(require("@talismn/chaindata-js"));
var import_util = __toModule(require("@talismn/util"));
var import_lodash = __toModule(require("lodash"));
const systemHash = "26aa394eea5630e07c48ae0c9558cef7";
const accountHash = "b99d880ec681799c0cf30e8886371da9";
const AccountInfo = JSON.stringify({
  nonce: "u32",
  consumer: "u32",
  providers: "u32",
  sufficients: "u32",
  data: {
    free: "u128",
    reserved: "u128",
    miscFrozen: "u128",
    feeFrozen: "u128"
  }
});
const registry = new import_types.TypeRegistry();
registry.register({ AccountInfo });
const pathsToEndpoints = {
  balance: {
    endpoint: `0x${systemHash}${accountHash}%s`,
    params: [String]
  }
};
class TalismanConnect {
  constructor(chainId, rpcs) {
    this.nativeToken = null;
    this.wsCreated = false;
    this.wsHandlers = {};
    this.wsNextHandlerId = 1;
    this.wsSubscriptions = {};
    this.wsLatestUnhandledSubscriptionData = {};
    this.chainId = chainId;
    this.rpcs = rpcs;
    return this;
  }
  getChainData() {
    return __async(this, null, function* () {
      var _a;
      if (!((_a = this.rpcs) == null ? void 0 : _a.length)) {
        const chain = yield import_chaindata_js.default.chain(this.chainId);
        this.rpcs = chain.rpcs;
      }
      if (!this.nativeToken) {
        const chain = yield import_chaindata_js.default.chain(this.chainId);
        this.nativeToken = chain.nativeToken;
      }
      return {
        rpcs: this.rpcs,
        nativeToken: this.nativeToken
      };
    });
  }
  connect() {
    return __async(this, null, function* () {
      if (!this.chainId)
        return;
      yield this.getChainData();
      return;
    });
  }
  subscribe(path, args, callback) {
    return __async(this, null, function* () {
      if (this.chainId === null) {
        console.warn("ignoring subscription request: chainId not set");
        return null;
      }
      for (const rpc of this.rpcs) {
        try {
          if (!rpc)
            throw new Error("failed to create subscription: rpc required");
          if (!rpc.startsWith("wss://") && !rpc.startsWith("ws://")) {
            throw new Error("failed to create subscription: ws or wss rpc protocol required");
          }
          const endpoint = (0, import_lodash.get)(pathsToEndpoints, path).endpoint;
          if (!endpoint)
            return null;
          const method = "state_subscribeStorage";
          const params = [
            args.map((args2) => (0, import_util.decodeAnyAddress)(args2[0])).map((addressBytes) => blake2Concat(addressBytes).replace("0x", "")).map((addressHash) => endpoint.replace("%s", `${addressHash}`))
          ];
          const response = yield this._wsRpcFetch(rpc, method, params);
          const result = JSON.parse(response).result;
          const subscriptionId = result;
          this.wsSubscriptions[subscriptionId] = callback;
          if (this.wsLatestUnhandledSubscriptionData[subscriptionId]) {
            this.wsLatestUnhandledSubscriptionData[subscriptionId].forEach(callback);
            delete this.wsLatestUnhandledSubscriptionData[subscriptionId];
          }
          const unsubscribe = () => __async(this, null, function* () {
            const method2 = "state_unsubscribeStorage";
            const params2 = [subscriptionId];
            const response2 = yield this._wsRpcFetch(rpc, method2, params2);
            const result2 = JSON.parse(response2).result;
            return result2;
          });
          return unsubscribe;
        } catch (error) {
          console.error(`Failed rpc subscription via ${rpc}`, error);
          continue;
        }
      }
      throw new Error(`Failed rpc subscription via all rpcs for chain ${this.chainId} callpath ${path}`);
    });
  }
  call(path, params, format) {
    return __async(this, null, function* () {
      if (!this.chainId)
        return null;
      for (const rpc of this.rpcs) {
        try {
          if (!rpc)
            throw new Error("rpc required");
          if (rpc.startsWith("wss://") || rpc.startsWith("ws://")) {
            return this._callWs(rpc, path, params, format);
          }
          if (rpc.startsWith("https://") || rpc.startsWith("http://")) {
            return this._callHttp(rpc, path, params, format);
          }
          console.warn("TalismanConnect.call not implemented. Try TalismanConnect.subscribe instead!");
          return null;
        } catch (error) {
          console.error(`Failed rpc call via ${rpc}`, error);
          continue;
        }
      }
      throw new Error(`Failed rpc call via all rpcs for chain ${this.chainId} callpath ${path}`);
    });
  }
  _callWs(rpc, path, args, format) {
    return __async(this, null, function* () {
      const endpoint = (0, import_lodash.get)(pathsToEndpoints, path).endpoint;
      if (!endpoint)
        return null;
      const address = args[0];
      const addressBytes = (0, import_util.decodeAnyAddress)(address);
      const addressHash = blake2Concat(addressBytes).replace("0x", "");
      const method = "state_getStorage";
      const params = [endpoint.replace("%s", `${addressHash}`)];
      const response = yield this._wsRpcFetch(rpc, method, params);
      const result = JSON.parse(response).result;
      const output = (0, import_types.createType)(registry, AccountInfo, result);
      return format({ chainId: this.chainId, nativeToken: this.nativeToken, output });
    });
  }
  _callHttp(rpc, _path, _args, _format) {
    return __async(this, null, function* () {
      throw new Error(`rpc via http not yet implemented: ${rpc}`);
    });
  }
  _wsRpcFetch(url, method, params) {
    return new Promise((resolve, reject) => __async(this, null, function* () {
      if (!this.wsCreated)
        this.wsCreated = this._createSocket(url);
      try {
        yield this.wsCreated;
      } catch (error) {
        this.wsCreated = false;
        reject(error);
      }
      if (this.ws === void 0)
        return reject("failed to create websocket connection");
      const id = this._nextWsHandlerId();
      this.wsHandlers[id] = (data) => {
        if (data === null)
          return reject();
        resolve(data);
      };
      const payload = JSON.stringify({ id, jsonrpc: "2.0", method, params });
      this.ws.send(payload);
    }));
  }
  _nextWsHandlerId() {
    const id = this.wsNextHandlerId;
    this.wsNextHandlerId = (this.wsNextHandlerId + 1) % 999999;
    return id;
  }
  _createSocket(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let skipHealthCheck = true;
      const keepaliveInterval = 1e4;
      const healthcheck = setInterval(() => {
        !skipHealthCheck && this._wsRpcFetch(url, "system_health", []);
      }, keepaliveInterval);
      socket.onopen = () => {
        this.ws = socket;
        skipHealthCheck = false;
        resolve();
      };
      socket.onmessage = (message) => {
        var _a;
        const data = JSON.parse(message.data);
        const isSubscriptionUpdate = data.method !== void 0 && typeof data.params.subscription === "string";
        if (isSubscriptionUpdate) {
          const subscriptionId = data.params.subscription;
          const formatChange = ([reference, change]) => ({
            chainId: this.chainId,
            nativeToken: this.nativeToken,
            reference,
            output: (0, import_types.createType)(registry, AccountInfo, change)
          });
          const handler2 = this.wsSubscriptions[subscriptionId];
          if (!handler2) {
            console.warn(`caching result for subscription ${subscriptionId}: no handler registered for this subscription id`);
            this.wsLatestUnhandledSubscriptionData[subscriptionId] = data.params.result.changes.map(formatChange);
            return;
          }
          data.params.result.changes.map(formatChange).forEach(handler2);
          return;
        }
        const id = (_a = JSON.parse(message.data)) == null ? void 0 : _a.id;
        if (!id) {
          console.warn("ignoring ws message with no id", data);
          return;
        }
        if (!this.wsHandlers[id]) {
          console.warn("ignoring ws message with unknown id", data);
          return;
        }
        const handler = this.wsHandlers[id];
        delete this.wsHandlers[id];
        handler(message.data);
      };
      socket.onerror = reject;
      socket.onclose = () => {
        clearInterval(healthcheck);
        this.ws = void 0;
        this.wsCreated = false;
        const handlers = Object.values(this.wsHandlers);
        this.wsHandlers = {};
        handlers.forEach((handler) => handler(null));
        this.wsSubscriptions = {};
        reject();
      };
    });
  }
}
TalismanConnect.type = "TALISMANCONNECT";
function blake2Concat(input) {
  const inputHash = (0, import_util_crypto.blake2AsHex)(input, 128);
  const inputHex = [...input].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${inputHash}${inputHex}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
