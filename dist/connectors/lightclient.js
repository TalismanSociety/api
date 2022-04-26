var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
  default: () => LightClient
});
class LightClient {
  constructor(chainId, rpcs) {
    this.chainId = chainId;
    this.rpcs = rpcs;
    return this;
  }
  connect() {
    return __async(this, null, function* () {
      throw new Error("lightclient connector not yet implemented");
    });
  }
  subscribe(_path, _args, _callback) {
    return __async(this, null, function* () {
      throw new Error("subscribe not yet implemented");
    });
  }
  call(_path, _params, _format) {
    return __async(this, null, function* () {
      throw new Error(`call not yet implemented`);
    });
  }
}
LightClient.type = "LIGHTCLIENT";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
