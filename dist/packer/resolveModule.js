"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function resolveModule(host, options, resolutionCache, moduleName, baseFile) {
    if (host.resolveModuleNames) {
        var r = host.resolveModuleNames([moduleName], baseFile);
        return r.length && r[0] || null;
    }
    else {
        var r = ts.resolveModuleName(moduleName, baseFile, options, host, resolutionCache);
        return r.resolvedModule || null;
    }
}
exports.default = resolveModule;
