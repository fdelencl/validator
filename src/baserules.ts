export type RuleFn = (value: any) => boolean;

export type RuleMap = Record<string, RuleFn>;

export const baseRules: RuleMap = {
  truthy: value => Boolean(value),
  number: value => typeof value === 'number' || !Number.isNaN(Number(value)),
  string: value => typeof value === 'string',
  not_empty_string: value => typeof value === 'string' && value.trim() !== '',
  boolean: value => typeof value === 'boolean',
  integer: value => baseRules.number(value) && Number.isInteger(Number(value)),
  timestamp_milliseconds: value => baseRules.integer(value),
  MD5: value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value),
  url: value => /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/.test(typeof value === 'string' ? value : ''),
  binary: value => value === '1' || value === '0',
  array: value => Array.isArray(value) === true,
  email: value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: value => typeof value === 'string' && /^\+?\d{1,3}?[\s.-]?(?:\(?\d+\)?[\s.-]?)+\d$/.test(value),
  latitude: value => typeof value === 'number',
  longitude: value => typeof value === 'number',
  ip: value => typeof value === 'string' && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(value),
};