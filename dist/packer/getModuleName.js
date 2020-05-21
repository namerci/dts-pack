"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
function getModuleName(baseModulePath, targetPath) {
    return path.relative(baseModulePath, targetPath).replace(/\..*?$/g, '').replace(/\\/g, '/');
}
exports.default = getModuleName;
