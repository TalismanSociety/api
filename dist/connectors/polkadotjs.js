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
  default: () => PolkadotJs
});
var import_api = __toModule(require("@polkadot/api"));
var import_chaindata_js = __toModule(require("@talismn/chaindata-js"));
var import_lodash = __toModule(require("lodash"));
const pathsToEndpoints = {
  balance: {
    endpoint: "query.system.account"
  }
};
class PolkadotJs {
  constructor(chainId, rpcs = []) {
    this.nativeToken = null;
    this.api = null;
    this.chainId = chainId;
    this.rpcs = rpcs;
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
      const { rpcs } = yield this.getChainData();
      const provider = new import_api.WsProvider(rpcs);
      yield import_api.ApiPromise.create({ provider, throwOnConnect: true }).then((api) => {
        this.api = api;
      });
      return;
    });
  }
  subscribe(_path, _args, _callback) {
    return __async(this, null, function* () {
      throw new Error("subscribe not yet implemented");
    });
  }
  call(path, args, format) {
    return __async(this, null, function* () {
      if (!this.chainId)
        return null;
      if (!this.api)
        throw new Error(`chain ${this.chainId} not ready`);
      const endpoint = (0, import_lodash.get)(pathsToEndpoints, path).endpoint;
      if (!endpoint)
        return null;
      const output = yield (0, import_lodash.get)(this.api, endpoint)(...args);
      return format({ chainId: this.chainId, nativeToken: this.nativeToken, output });
    });
  }
}
PolkadotJs.type = "POLKADOTJS";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
