import { RuleFn, RuleMap, baseRules } from "./baserules";

export type { RuleFn, RuleMap };
export { baseRules };

export type SchemaString = string;

export type SchemaObject = { [key: string]: Schema };

export type SchemaArray = Schema[];

export interface SchemaWrapper {
  opt?: boolean;
  schema: Schema;
}

export type Schema = SchemaString | SchemaObject | SchemaArray | SchemaWrapper;

export interface ValidationErrorObject {
    [key: string]: ValidationErrorObject | string[] | undefined;
}

export type ValidationResult = ValidationErrorObject | string[] | undefined;

function evaluateComparison(
  value: unknown,
  instruction: string
): boolean | undefined {
  if (typeof value !== "number") return undefined;
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
      return undefined;
  }
}

function validate(
  value: unknown,
  instruction: string,
  rules: RuleMap
): string[] {
  const conditions = instruction.split("|").map((c) => {
    const [opt, message] = c.split("??");
    return { opt, message };
  });

  const isOptional = conditions.some((c) => c.opt === "opt");
  if (isOptional && value === undefined) return [];
  if (value === undefined)
    return conditions.map(({ opt, message }) => message || opt);

  return conditions
    .map(({ opt, message }) => {
      if (rules[opt]) {
        return rules[opt](value) ? undefined : message || opt;
      }
      if (/^[<|>|=]=?\d+$/.test(opt)) {
        return evaluateComparison(
          typeof value === "number" ? value : Number(value),
          opt
        )
          ? undefined
          : message || opt;
      }
      return undefined;
    })
    .filter((c): c is string => Boolean(c));
}

function hasSchemaWrapper(schema: Schema): schema is SchemaWrapper {
  return (
    !!schema &&
    typeof schema === "object" &&
    !Array.isArray(schema) &&
    "schema" in schema
  );
}

function trimUnknownKeys(
  target: Record<string, unknown>,
  schema: SchemaObject
) {
  Object.keys(target).forEach((key) => {
    if (schema[key] === undefined) delete target[key];
  });
}

function checkValue(
  obj: unknown,
  schema: Schema,
  rules: RuleMap
): ValidationResult {
  if (Array.isArray(schema)) {
    if (!Array.isArray(obj)) return ["array"];

    const invalidEntries = obj.map((o) =>{
      const ret = schema.map((s) => checkValue(o, s, rules));
      if (ret.some((e) => e === undefined))
        return undefined;
      return ret;
    })
    
    if (invalidEntries.find((e) => e !== undefined)) {
      return invalidEntries.flat() as unknown as string[];
    }
    return undefined;
  }

  if (hasSchemaWrapper(schema)) {
    if (obj === undefined && schema.opt === true) return undefined;
    return checkValue(obj, schema.schema, rules);
  }

  if (schema && typeof schema === "object") {
    if (typeof obj !== "object" || obj === undefined) return ["object"];

    const workingObj = obj as Record<string, unknown>;
    trimUnknownKeys(workingObj, schema as SchemaObject);

    const result: ValidationErrorObject = {};
    Object.keys(schema as SchemaObject).forEach((key) => {
      result[key] = checkValue(
        workingObj[key],
        (schema as SchemaObject)[key],
        rules
      );
    });

    Object.keys(result).forEach((key) => {
      if (
        result[key] === undefined ||
        (typeof result[key] === "object" &&
          !Object.keys(result[key] as object).length)
      ) {
        delete result[key];
      }
    });

    return Object.keys(result).length ? result : undefined;
  }

  if (typeof schema === "string") {
    const ret = validate(obj, schema, rules);
    return ret.length ? ret : undefined;
  }

  return undefined;
}

export function check(
  obj: unknown,
  schema: Schema,
  customRules: RuleMap = {}
): ValidationResult {
  const rules: RuleMap = { ...baseRules, ...customRules };
  return checkValue(obj, schema, rules);
}

export default check;
