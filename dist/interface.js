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
  default: () => interface_default
});
var import_util = __toModule(require("@talismn/util"));
var import_bignumber = __toModule(require("bignumber.js"));
var import_p_map = __toModule(require("p-map"));
const newSubscriptionsConcurrencyLimit = 10;
const requestConcurrencyLimit = 2;
class Interface {
  constructor() {
    this.factory = null;
  }
  setFactory(factory) {
    this.factory = factory;
  }
  init(props) {
    if (!this.factory)
      throw new Error("failed to init: no factory set");
    this.factory.init(props);
    return this;
  }
  connect(props) {
    return __async(this, null, function* () {
      if (!this.factory)
        throw new Error("failed to connect: no factory set");
      yield this.factory.connect(props);
      return this;
    });
  }
  subscribeBalances(chainIds = [], addresses = [], callback) {
    const subscriptions = chainIds.flatMap((chainId) => ({ chainId, addresses }));
    const addressesByHex = Object.fromEntries(addresses.map((address) => [
      [...(0, import_util.decodeAnyAddress)(address)].map((x) => x.toString(16).padStart(2, "0")).join(""),
      address
    ]));
    const unsubscribeCallbacks = (0, import_p_map.default)(subscriptions, (_0) => __async(this, [_0], function* ({ chainId, addresses: addresses2 }) {
      const path = "balance";
      const format = ({ reference, output, chainId: chainId2, nativeToken }) => {
        var _a, _b, _c, _d;
        const [, address] = Object.entries(addressesByHex).find(([hex]) => reference.endsWith(hex)) || [];
        if (!address) {
          console.error(`failed to find address ${reference.slice(-64)} in map ${Object.keys(addressesByHex).join(", ")}`);
          return;
        }
        if (output === null) {
          callback(null, chainId2, address);
          return;
        }
        const free = new import_bignumber.default(((_a = output.data) == null ? void 0 : _a.free.toString()) || "0");
        const reserved = new import_bignumber.default(((_b = output.data) == null ? void 0 : _b.reserved.toString()) || "0");
        const miscFrozen = new import_bignumber.default(((_c = output.data) == null ? void 0 : _c.miscFrozen.toString()) || "0");
        const feeFrozen = new import_bignumber.default(((_d = output.data) == null ? void 0 : _d.feeFrozen.toString()) || "0");
        const total = free.plus(reserved);
        callback({
          chainId: chainId2,
          token: nativeToken,
          address,
          total: total.toString(),
          free: free.toString(),
          reserved: reserved.toString(),
          miscFrozen: miscFrozen.toString(),
          feeFrozen: feeFrozen.toString()
        }, chainId2, address);
      };
      if (!this.factory)
        throw new Error(`failed to subscribe to balances on chain ${chainId}: no factory set`);
      try {
        return yield this.factory.subscribe(chainId, path, addresses2.map((address) => [address]), format);
      } catch (error) {
        console.error(`failed to subscribe to balances on chain ${chainId}`, error);
        return;
      }
    }), { concurrency: newSubscriptionsConcurrencyLimit });
    const unsubscribe = () => unsubscribeCallbacks.then((callbacks) => callbacks.forEach((callback2) => callback2 && callback2()));
    return unsubscribe;
  }
  balances() {
    return __async(this, arguments, function* (addresses = []) {
      return (yield (0, import_p_map.default)(typeof addresses === "string" ? [addresses] : addresses, (address) => __async(this, null, function* () {
        const path = "balance";
        const format = ({ output, chainId, nativeToken }) => {
          var _a, _b, _c, _d;
          if (output === null)
            return null;
          const free = new import_bignumber.default(((_a = output.data) == null ? void 0 : _a.free.toString()) || "0");
          const reserved = new import_bignumber.default(((_b = output.data) == null ? void 0 : _b.reserved.toString()) || "0");
          const miscFrozen = new import_bignumber.default(((_c = output.data) == null ? void 0 : _c.miscFrozen.toString()) || "0");
          const feeFrozen = new import_bignumber.default(((_d = output.data) == null ? void 0 : _d.feeFrozen.toString()) || "0");
          const total = free.plus(reserved);
          return {
            chainId,
            token: nativeToken,
            address,
            total: total.toString(),
            free: free.toString(),
            reserved: reserved.toString(),
            miscFrozen: miscFrozen.toString(),
            feeFrozen: feeFrozen.toString()
          };
        };
        if (!this.factory)
          throw new Error("failed to get balance: no factory set");
        try {
          return yield this.factory.callChains(path, [address], format);
        } catch (error) {
          console.error(`failed to get balances for address ${address}`, error);
          return [];
        }
      }), { concurrency: requestConcurrencyLimit })).flatMap((balances) => balances).filter((balance) => balance !== null);
    });
  }
}
var interface_default = Interface;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
