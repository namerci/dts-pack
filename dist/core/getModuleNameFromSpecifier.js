"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function getModuleNameFromSpecifier(moduleSpecifier) {
    if (ts.isStringLiteral(moduleSpecifier)) {
        return moduleSpecifier.text;
    }
    else {
        return moduleSpecifier.getText();
    }
}
exports.default = getModuleNameFromSpecifier;
