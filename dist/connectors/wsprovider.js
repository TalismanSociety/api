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
  default: () => WsProviderConnector
});
var import_api = __toModule(require("@polkadot/api"));
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
const KiltAccountInfo = JSON.stringify({
  nonce: "u64",
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
const pathsToEndpoints = {
  balance: {
    endpoint: `0x${systemHash}${accountHash}%s`,
    params: [String]
  }
};
class WsProviderConnector {
  constructor(chainId, rpcs) {
    this.nativeToken = null;
    this.killHealthCheck = false;
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
      const autoConnectMs = 1e3;
      this.ws = new import_api.WsProvider(this.rpcs, autoConnectMs);
      (() => __async(this, null, function* () {
        if (!this.ws)
          return console.warn("ignoring ws healthcheck init: this.ws is not defined");
        yield this.ws.isReady;
        const intervalMs = 1e4;
        const intervalId = setInterval(() => {
          if (this.killHealthCheck)
            return clearInterval(intervalId);
          if (!this.ws)
            return console.warn("skipping ws healthcheck: this.ws is not defined");
          this.ws.send("system_health", []);
        }, intervalMs);
      }))();
      return;
    });
  }
  subscribe(path, args, callback) {
    return __async(this, null, function* () {
      if (this.chainId === null) {
        console.warn("ignoring subscription request: chainId not set");
        return null;
      }
      if (!this.ws) {
        console.warn("ignoring subscription request: initialize connector with connect() before calling subscribe()");
        return null;
      }
      const endpoint = (0, import_lodash.get)(pathsToEndpoints, path).endpoint;
      if (!endpoint)
        return null;
      const method = "state_subscribeStorage";
      const returnMethod = "state_storage";
      const params = [
        args.map((args2) => (0, import_util.decodeAnyAddress)(args2[0])).map((addressBytes) => blake2Concat(addressBytes).replace("0x", "")).map((addressHash) => endpoint.replace("%s", `${addressHash}`))
      ];
      const formatType = this.chainId === "2-2086" ? KiltAccountInfo : AccountInfo;
      const formatChange = ([reference, change]) => ({
        chainId: this.chainId,
        nativeToken: this.nativeToken,
        reference,
        output: (0, import_types.createType)(registry, formatType, change)
      });
      yield this.ws.isReady;
      const subscriptionId = yield this.ws.subscribe(returnMethod, method, params, (error, result) => {
        var _a;
        if (error)
          return console.error(`RPC error for chain ${this.chainId}: ${error.toString()}`);
        (_a = result == null ? void 0 : result.changes) == null ? void 0 : _a.map(formatChange).forEach(callback);
      });
      const unsubscribe = () => __async(this, null, function* () {
        if (!this.ws)
          return console.warn("ignoring unsubscribe request: this.ws is not defined");
        const method2 = "state_unsubscribeStorage";
        return yield this.ws.unsubscribe(returnMethod, method2, subscriptionId);
      });
      return unsubscribe;
    });
  }
  call(path, params, format) {
    return __async(this, null, function* () {
      if (!this.chainId)
        return null;
      console.warn("WsProviderConnector.call not implemented. Try WsProviderConnector.subscribe instead!");
      return null;
    });
  }
}
WsProviderConnector.type = "WSPROVIDER";
function blake2Concat(input) {
  const inputHash = (0, import_util_crypto.blake2AsHex)(input, 128);
  const inputHex = [...input].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${inputHash}${inputHex}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
