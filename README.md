# Jin-validator
jin-validator is a package designed to check the content of any javascript object and trim any undesired elements from it.
It works by verifying a set of rules to your object. The rules to apply to each element is established by setting up a Schema object which describe which rule to apply to which part of you object.

### Installation

```sh
$ npm install --save @jin-pack/jin-validator
```

# Use
A list of rules are provided with the package and can be supplemented by you own set of rules for specific uses.

- truthy: the value must be truthy

- number: the value must be a number or castable as a number (ex: 23.5 or '23.5')

- string: the value must be a string type

- boolean: the value must be a boolean type

- integer: the value must be castable as an integer (ex: 23 or '23')

- MD5: the value must be a string that is 32 character long of only alphanumeric characters

- url: starts with 'http://' or 'https://' with no space inside

- binary: the value is either '0' or '1'

- opt: the value is optional

For numbers, you can also use rules like '>X', '<=Y' or '=Z' where X, Y and Z are numbers. The value will be checked acording to the rule.

---
A variable is checked by calling each rule to check in a string separated by a '|'
example:
```javascript
const schema = { var1: 'opt|number|>=100|<999'}
```
This schema will make sure that the element 'var1' in your object is a number between 100 included and 999 excluded if the element exists.

---

For the case you need to validate a nested object your schema will look like this:
```javascript
const schema = {
    nested1: { var1: 'opt|number|>=100|<999' },
    nested2: {
        opt: true,
        schema: { var2: 'opt|number|>=100|<999' }
    }
}
```
in this case:

- the 'nested1' variable is not optionnal and can contain 'var1'.

- the 'nested2' variable is optionnal and can contain 'var2'.


---
For the case you need to validate an array, your schema will look like this:
```javascript
const schema = {
    array1: ['string|truthy','integer|<0'],
    array2: {
        opt: true,
        schema: ['boolean']
    }
}
```
in this case:

- the 'array1' variable is not optionnal and may only contain variables that accord to at least one of the rules described in the schema.

- the 'nested2' variable is optionnal and may only contain booleans.


---
To add your own set of rules to the list of default rules or override existing ones you will have to create an object where each key is the name of the rule you wish to call and each value is a function returning an value that is truthy if it's ok or falsy if it is not ok.

example:
```javascript
const customRules = {
    fruit: value => ['banana', 'apple', 'tomato', 'ananas'].includes(value),
    vegetable: value => ['eggplant', 'carrot', 'onion'].includes(value)
}
```

---
To validate an object you need to require the package in your file and directly call the function and give the required parameters:

- object: the object you want to validate

- schema: the schema you want your object to accord to

- customRules (optionnal): the custom rules relative to your specific use


example:
```javascript
const validator = require('@jin-pack/jin-validator');
const validation = validator({ user: 'George' }, { user: 'string|truthy|name' }, { name: value => !value.includes(' ') } );
```

---
The return values are:
- _null_ if everything is alright

- an object showing each variable that didn't pass with for each variable an array of error message for which rule didn't make it.


---
**!! Be Carefull !!** If the object contains variables that are not mentionned in the schema, they are deleted.

---
**!! Be Carefull !!** If a rule described in the schema is absent from the list of available rules, it is ignored.

---
### Example use
```javascript
const validator = require('@jin-pack/jin-validator');

const opt = {
    statusValue: value => ['published', 'deleted'].includes(value)
};

const schema = {
    user: 'integer',
    results: [{
        result_uid: 'MD5',
        client_id: 'integer|>0',
        sentiment: 'opt|integer',
        status: {
            opt: true,
            schema: {
                value: 'opt|truthy|string|statusValue'
            }
        }
    }]
}

function validation(req, res, next) {
    const error = validator(req.body, schema, opt);
    if (error) res.status(400).json(error);
    else next();
}
```

