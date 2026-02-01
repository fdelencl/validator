type RuleFn = (value: any) => boolean;
type RuleMap = Record<string, RuleFn>;
declare const baseRules: RuleMap;

type SchemaString = string;
type SchemaObject = {
    [key: string]: Schema;
};
type SchemaArray = Schema[];
interface SchemaWrapper {
    opt?: boolean;
    schema: Schema;
}
type Schema = SchemaString | SchemaObject | SchemaArray | SchemaWrapper;
interface ValidationErrorObject {
    [key: string]: ValidationErrorObject | string[] | undefined;
}
type ValidationResult = ValidationErrorObject | string[] | undefined;
declare function check(obj: unknown, schema: Schema, customRules?: RuleMap): ValidationResult;

export { type RuleFn, type RuleMap, type Schema, type SchemaArray, type SchemaObject, type SchemaString, type SchemaWrapper, type ValidationErrorObject, type ValidationResult, baseRules, check, check as default };
