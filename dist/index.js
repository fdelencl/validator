"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  check: () => check,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var baseRules = {
  truthy: (value) => Boolean(value),
  number: (value) => typeof value === "number" || !Number.isNaN(Number(value)),
  string: (value) => typeof value === "string",
  boolean: (value) => typeof value === "boolean",
  integer: (value) => baseRules.number(value) && Number.isInteger(Number(value)),
  timestamp_milliseconds: (value) => baseRules.integer(value),
  MD5: (value) => typeof value === "string" && /^[a-f0-9]{32}$/.test(value),
  url: (value) => /^(?:https|http):\/\/[^ ]{1,}$/.test(typeof value === "string" ? value : ""),
  binary: (value) => value === "1" || value === "0",
  array: (value) => Array.isArray(value) === true
};
function evaluateComparison(value, instruction) {
  if (typeof value !== "number")
    return null;
  switch (instruction[0]) {
    case ">":
      if (instruction[1] === "=")
        return value >= Number(instruction.substring(2));
      return value > Number(instruction.substring(1));
    case "<":
      if (instruction[1] === "=")
        return value <= Number(instruction.substring(2));
      return value < Number(instruction.substring(1));
    case "=":
      if (instruction[1] === "=")
        return value === Number(instruction.substring(2));
      return value === Number(instruction.substring(1));
    default:
      return null;
  }
}
function validate(value, instruction, rules) {
  const conditions = instruction.split("|").map((c) => {
    const [opt, message] = c.split("??");
    return { opt, message };
  });
  const isOptional = conditions.some((c) => c.opt === "opt");
  if (isOptional && value === void 0)
    return [];
  if (value === void 0)
    return conditions.map(({ opt, message }) => message || `should be ${opt}`);
  return conditions.map(({ opt, message }) => {
    if (rules[opt]) {
      return rules[opt](value) ? null : message || `should be ${opt}`;
    }
    if (/^[<|>|=]=?\d+$/.test(opt)) {
      return evaluateComparison(typeof value === "number" ? value : Number(value), opt) ? null : message || `should be ${opt}`;
    }
    return null;
  }).filter((c) => Boolean(c));
}
function hasSchemaWrapper(schema) {
  return !!schema && typeof schema === "object" && !Array.isArray(schema) && "schema" in schema;
}
function trimUnknownKeys(target, schema) {
  Object.keys(target).forEach((key) => {
    if (schema[key] === void 0)
      delete target[key];
  });
}
function checkValue(obj, schema, rules) {
  if (Array.isArray(schema)) {
    if (!Array.isArray(obj))
      return ["should be an array"];
    const invalidEntries = obj.map((o) => schema.find((s) => {
      const result = checkValue(o, s, rules);
      return result == null || typeof result === "object" && !Object.keys(result).length;
    })).filter((o) => !o);
    return invalidEntries.length ? `must respect this schema: ${JSON.stringify(schema)}` : null;
  }
  if (hasSchemaWrapper(schema)) {
    if (obj === void 0 && schema.opt === true)
      return null;
    return checkValue(obj, schema.schema, rules);
  }
  if (schema && typeof schema === "object") {
    if (typeof obj !== "object" || obj === null)
      return ["should be an object"];
    const workingObj = obj;
    trimUnknownKeys(workingObj, schema);
    const result = {};
    Object.keys(schema).forEach((key) => {
      result[key] = checkValue(workingObj[key], schema[key], rules);
    });
    Object.keys(result).forEach((key) => {
      if (result[key] === null || typeof result[key] === "object" && !Object.keys(result[key]).length) {
        delete result[key];
      }
    });
    return Object.keys(result).length ? result : null;
  }
  if (typeof schema === "string") {
    const ret = validate(obj, schema, rules);
    return ret.length ? ret : null;
  }
  return null;
}
function check(obj, schema, customRules = {}) {
  const rules = { ...baseRules, ...customRules };
  return checkValue(obj, schema, rules);
}
var src_default = check;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  check
});
