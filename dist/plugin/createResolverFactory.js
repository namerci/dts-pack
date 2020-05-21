"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var path = require("path");
/// <reference path="./enhanced-resolve-node.d.ts" />
var node = require("enhanced-resolve/lib/node");
function resolveModuleName(scriptPattern, compilerOptions, resolver, host, resolutionCache, moduleName, containingFile) {
    var result;
    try {
        var resolvedName = resolver(path.normalize(path.dirname(containingFile)), moduleName);
        if (resolvedName.match(scriptPattern)) {
            result = {
                resolvedFileName: resolvedName
            };
        }
    }
    catch (_e) { }
    var resolvedByTs = ts.resolveModuleName(moduleName, containingFile, compilerOptions, host, resolutionCache);
    if (resolvedByTs.resolvedModule) {
        // use resolved module from TypeScript if one of followings are true:
        // - enhanced-resolve cannot resolve
        // - resolved module is same
        // - enhanced-resolve resolved '.js' file and TypeScript resolved '.d.ts' file (using type declaration file)
        if (!result ||
            result.resolvedFileName === resolvedByTs.resolvedModule.resolvedFileName ||
            (/\.js$/i.test(result.resolvedFileName) && /\.d\.ts$/i.test(resolvedByTs.resolvedModule.resolvedFileName))) {
            result = resolvedByTs.resolvedModule;
        }
    }
    return result;
}
function createResolverFactory(pluginOptions, resolve) {
    if (pluginOptions.useTsModuleResolution) {
        // simply uses ts.resolveModuleName
        return function (_options, compilerOptions, host, resolutionCache) {
            return function (moduleNames, containingFile) {
                return moduleNames.map(function (moduleName) { return ts.resolveModuleName(moduleName, containingFile, compilerOptions, host, resolutionCache).resolvedModule; });
            };
        };
    }
    else {
        // uses enhanced-resolve
        return function (_options, compilerOptions, host, resolutionCache) {
            var resolveSync = node.create.sync(resolve);
            var scriptPattern = pluginOptions.scriptPattern || /\.tsx$/;
            return function (moduleNames, containingFile) {
                return moduleNames.map(function (moduleName) { return resolveModuleName(scriptPattern, compilerOptions, resolveSync, host, resolutionCache, moduleName, containingFile); });
            };
        };
    }
}
exports.default = createResolverFactory;
