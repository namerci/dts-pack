"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getModuleName_1 = require("./getModuleName");
function getNamespaceName(moduleBasePath, targetPath, options) {
    var r = getModuleName_1.default(moduleBasePath, targetPath);
    var n = options.moduleName.replace(/[^A-Za-z0-9\_\$]/g, '_');
    return n + "." + r;
}
exports.default = getNamespaceName;
