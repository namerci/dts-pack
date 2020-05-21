"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function createStringLiteral(text, singleQuote) {
    if (singleQuote === void 0) { singleQuote = true; }
    var r = ts.createLiteral(text);
    r.singleQuote = singleQuote;
    return r;
}
exports.default = createStringLiteral;
