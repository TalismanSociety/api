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
  default: () => factory_default
});
var import_chaindata_js = __toModule(require("@talismn/chaindata-js"));
var import_p_map = __toModule(require("p-map"));
var import_connectors = __toModule(require("./connectors"));
const chainConcurrencyLimit = 10;
class Factory {
  constructor() {
    this.type = import_connectors.ConnectorTypes[0];
    this.chains = [];
    this.rpcs = {};
    this.connected = false;
    this.instancePool = {};
    this.connectedChains = {};
    this.isInitialised = false;
  }
  subscribe(chainId, path, args, callback) {
    return __async(this, null, function* () {
      if (!this.connectedChains[chainId]) {
        const Connector2 = import_connectors.default[this.type];
        this.connectedChains[chainId] = new Connector2(chainId, chainId ? this.rpcs[chainId] : []);
      }
      const connector = this.connectedChains[chainId];
      try {
        yield connector.connect();
      } catch (error) {
        console.error(`failed to connect to chain ${chainId}`, error);
        return null;
      }
      try {
        return connector.subscribe(path, args, callback);
      } catch (error) {
        console.error("failed to subscribe to chain endpoint", error);
        return null;
      }
    });
  }
  init({ type, chains = [], rpcs = {} }, reInit = false) {
    if (this.isInitialised === true && reInit !== true)
      return this;
    this.isInitialised = true;
    if (type !== void 0)
      this.type = type;
    this.chains = chains.map((chain) => chain.toString());
    this.rpcs = rpcs;
    return this;
  }
  connect(_0) {
    return __async(this, arguments, function* ({ type, chains = [], rpcs = {} }, reInit = false) {
      if (this.isInitialised === true && reInit !== true)
        return this;
      this.isInitialised = true;
      if (type !== void 0)
        this.type = type;
      this.chains = chains.map((chain) => chain.toString());
      this.rpcs = rpcs;
      this.connectedChains = yield this.connectChains();
      return this;
    });
  }
  connectChains() {
    return __async(this, null, function* () {
      return Object.fromEntries(yield (0, import_p_map.default)(yield this.validateChainIds(), (id) => __async(this, null, function* () {
        if (id === null)
          return [id];
        const Connector2 = import_connectors.default[this.type];
        const instance = new Connector2(id, id ? this.rpcs[id] : []);
        try {
          yield instance.connect();
        } catch (error) {
          console.error(`failed to connect to chain ${id}`, error);
        }
        return [id, instance];
      }), { concurrency: chainConcurrencyLimit }));
    });
  }
  callChains(path, params, format) {
    return __async(this, null, function* () {
      return yield (0, import_p_map.default)(Object.values(this.connectedChains), (chain) => __async(this, null, function* () {
        try {
          return yield chain.call(path, params, format);
        } catch (error) {
          console.error("failed to call chain endpoint", error);
          return null;
        }
      }), { concurrency: chainConcurrencyLimit });
    });
  }
  validateChainIds() {
    return __async(this, null, function* () {
      const allChains = yield import_chaindata_js.default.chains();
      const allChainIds = Object.keys(allChains);
      return this.chains.length < 1 ? allChainIds : this.chains.map((id) => allChainIds.includes(id) ? id : null);
    });
  }
}
var factory_default = Factory;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
