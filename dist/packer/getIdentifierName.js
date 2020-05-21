"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getIdentifierName(name, options) {
    if (name === 'default') {
        return options.defaultName || '_default';
    }
    return name;
}
exports.default = getIdentifierName;
