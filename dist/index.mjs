// src/baserules.ts
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
  array: (value) => Array.isArray(value) === true,
  email: (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => typeof value === "string" && /^[0-9]{10}$/.test(value),
  zip: (value) => typeof value === "string" && /^[0-9]{5}$/.test(value),
  city: (value) => typeof value === "string",
  state: (value) => typeof value === "string",
  country: (value) => typeof value === "string",
  latitude: (value) => typeof value === "number",
  longitude: (value) => typeof value === "number",
  ip: (value) => typeof value === "string" && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(value)
};

// src/index.ts
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
      return evaluateComparison(
        typeof value === "number" ? value : Number(value),
        opt
      ) ? null : message || `should be ${opt}`;
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
    const invalidEntries = obj.map(
      (o) => schema.find((s) => {
        const result = checkValue(o, s, rules);
        return result == null || typeof result === "object" && !Object.keys(result).length;
      })
    ).filter((o) => !o);
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
      result[key] = checkValue(
        workingObj[key],
        schema[key],
        rules
      );
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
export {
  check,
  src_default as default
};
