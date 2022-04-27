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
__export(exports, {
  ConnectorTypes: () => ConnectorTypes,
  default: () => connectors_default
});
var import_lightclient = __toModule(require("./lightclient"));
var import_polkadotjs = __toModule(require("./polkadotjs"));
var import_talismanconnect = __toModule(require("./talismanconnect"));
var import_wsprovider = __toModule(require("./wsprovider"));
const ConnectorTypes = [import_polkadotjs.default.type, import_talismanconnect.default.type, import_lightclient.default.type, import_wsprovider.default.type];
const Connectors = {
  [import_talismanconnect.default.type]: import_talismanconnect.default,
  [import_lightclient.default.type]: import_lightclient.default,
  [import_polkadotjs.default.type]: import_polkadotjs.default,
  [import_wsprovider.default.type]: import_wsprovider.default
};
var connectors_default = Connectors;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConnectorTypes
});
