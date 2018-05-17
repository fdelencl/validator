/* eslint-disable no-param-reassign */

'use strict';

const lib = {
    truthy: value => value,
    number: value => typeof value === 'number' || !Number.isNaN(Number(value)),
    string: value => typeof value === 'string',
    boolean: value => typeof value === 'boolean',
    integer: value => lib.number(value) && Number.isInteger(Number(value)),
    timestamp_milliseconds: value => lib.integer(value),
    MD5: value => lib.string(value) && /^[a-f0-9]{32}$/.test(value),
    url: value => /^(?:https|http):\/\/[^ ]{1,}$/.test(value),
    binary: value => value === '1' || value === '0',
    array: value => Array.isArray(value) === true
};

function equal(value, instruction) {
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

function validate(value, instruction) {
    const conditions = instruction.split('|');
    if (conditions.includes('opt') && value === undefined) return [];
    else if (value === undefined) return conditions.map(c => `should be ${c}`);
    const ret = conditions.map((c) => {
        if (lib[c]) {
            return (lib[c](value) ? null : `should be ${c}`);
        } else if (/^[<|>|=]=?\d+$/.test(c)) {
            return (equal(value, c) ? null : `should be ${c}`);
        }
        return null;
    })
        .filter(c => c);
    return ret;
}

function check(obj, schema, opt = {}) {
    Object.keys(opt).forEach((o) => { lib[o] = opt[o]; });
    if (Array.isArray(schema)) {
        if (!Array.isArray(obj)) return ['should be an array'];
        const ret = obj.map(o => schema.find((s) => {
            const r = check(o, s);
            return (r == null || !Object.keys(r).length);
        }))
            .filter(o => !o);
        return ret.length ? `must respect this schema: ${JSON.stringify(schema)}` : null;
    } else if (typeof schema === 'object') {
        if (schema.schema) {
            if (obj === undefined && schema.opt === true) return null;
            return check(obj, schema.schema);
        }
        if (!(typeof obj === 'object')) return ['should be an object'];
        const ret = {};
        Object.keys(obj).forEach((key) => { if (schema[key] === undefined) delete obj[key]; });

        Object.keys(schema).forEach((s) => { ret[s] = check(obj[s], schema[s]); });
        Object.keys(ret).forEach((r) => { if (ret[r] === null) delete ret[r]; });
        return !Object.keys(ret).length ? null : ret;
    } else if (typeof schema === 'string') {
        const ret = validate(obj, schema);
        return ret.length ? ret : null;
    }
    return null;
}

module.exports = check;
