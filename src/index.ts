export type RuleFn = (value: unknown) => boolean;

export type RuleMap = Record<string, RuleFn>;

export type SchemaString = string;

export type SchemaObject = { [key: string]: Schema };

export type SchemaArray = Schema[];

export interface SchemaWrapper {
    opt?: boolean;
    schema: Schema;
}

export type Schema = SchemaString | SchemaObject | SchemaArray | SchemaWrapper;

export interface ValidationErrorObject {
    [key: string]: ValidationErrorObject | string[] | string | null;
}

export type ValidationResult = ValidationErrorObject | string[] | string | null;

const baseRules: RuleMap = {
    truthy: value => Boolean(value),
    number: value => typeof value === 'number' || !Number.isNaN(Number(value)),
    string: value => typeof value === 'string',
    boolean: value => typeof value === 'boolean',
    integer: value => baseRules.number(value) && Number.isInteger(Number(value)),
    timestamp_milliseconds: value => baseRules.integer(value),
    MD5: value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value),
    url: value => /^(?:https|http):\/\/[^ ]{1,}$/.test(typeof value === 'string' ? value : ''),
    binary: value => value === '1' || value === '0',
    array: value => Array.isArray(value) === true
};

function evaluateComparison(value: unknown, instruction: string): boolean | null {
    if (typeof value !== 'number') return null;
    switch (instruction[0]) {
    case '>':
        if (instruction[1] === '=') return value >= Number(instruction.substring(2));
        return value > Number(instruction.substring(1));
    case '<':
        if (instruction[1] === '=') return value <= Number(instruction.substring(2));
        return value < Number(instruction.substring(1));
    case '=':
        if (instruction[1] === '=') return value === Number(instruction.substring(2));
        return value === Number(instruction.substring(1));
    default:
        return null;
    }
}

function validate(value: unknown, instruction: string, rules: RuleMap): string[] {
    const conditions = instruction.split('|').map((c) => {
        const [opt, message] = c.split('??');
        return { opt, message };
    });

    const isOptional = conditions.some(c => c.opt === 'opt');
    if (isOptional && value === undefined) return [];
    if (value === undefined) return conditions.map(({ opt, message }) => message || `should be ${opt}`);

    return conditions
        .map(({ opt, message }) => {
            if (rules[opt]) {
                return rules[opt](value) ? null : message || `should be ${opt}`;
            }
            if (/^[<|>|=]=?\d+$/.test(opt)) {
                return evaluateComparison(typeof value === 'number' ? value : Number(value), opt)
                    ? null
                    : message || `should be ${opt}`;
            }
            return null;
        })
        .filter((c): c is string => Boolean(c));
}

function hasSchemaWrapper(schema: Schema): schema is SchemaWrapper {
    return !!schema && typeof schema === 'object' && !Array.isArray(schema) && 'schema' in schema;
}

function trimUnknownKeys(target: Record<string, unknown>, schema: SchemaObject) {
    Object.keys(target).forEach((key) => {
        if (schema[key] === undefined) delete target[key];
    });
}

function checkValue(obj: unknown, schema: Schema, rules: RuleMap): ValidationResult {
    if (Array.isArray(schema)) {
        if (!Array.isArray(obj)) return ['should be an array'];

        const invalidEntries = obj
            .map((o) => schema.find((s) => {
                const result = checkValue(o, s, rules);
                return result == null || (typeof result === 'object' && !Object.keys(result).length);
            }))
            .filter(o => !o);

        return invalidEntries.length ? `must respect this schema: ${JSON.stringify(schema)}` : null;
    }

    if (hasSchemaWrapper(schema)) {
        if (obj === undefined && schema.opt === true) return null;
        return checkValue(obj, schema.schema, rules);
    }

    if (schema && typeof schema === 'object') {
        if (typeof obj !== 'object' || obj === null) return ['should be an object'];

        const workingObj = obj as Record<string, unknown>;
        trimUnknownKeys(workingObj, schema as SchemaObject);

        const result: ValidationErrorObject = {};
        Object.keys(schema as SchemaObject).forEach((key) => {
            result[key] = checkValue(workingObj[key], (schema as SchemaObject)[key], rules);
        });

        Object.keys(result).forEach((key) => {
            if (result[key] === null || (typeof result[key] === 'object' && !Object.keys(result[key] as object).length)) {
                delete result[key];
            }
        });

        return Object.keys(result).length ? result : null;
    }

    if (typeof schema === 'string') {
        const ret = validate(obj, schema, rules);
        return ret.length ? ret : null;
    }

    return null;
}

export function check(obj: unknown, schema: Schema, customRules: RuleMap = {}): ValidationResult {
    const rules: RuleMap = { ...baseRules, ...customRules };
    return checkValue(obj, schema, rules);
}

export default check;

