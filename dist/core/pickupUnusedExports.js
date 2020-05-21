"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var resolveModule_1 = require("../packer/resolveModule");
var isEqualPath_1 = require("../utils/isEqualPath");
function cloneExportData(data) {
    return data.map(function (x) {
        return {
            baseName: x.baseName,
            moduleName: x.moduleName,
            node: x.node,
            namedExports: x.namedExports.map(function (named) {
                return {
                    name: named.name,
                    baseName: named.baseName,
                    node: named.node
                };
            })
        };
    });
}
function pickupUnusedExports(entryFile, entryExport, allData, host, compilerOptions, resolutionCache) {
    var ret = {};
    Object.keys(allData).forEach(function (fileName) {
        if (isEqualPath_1.default(entryFile, fileName)) {
            entryFile = fileName;
        }
        ret[fileName] = cloneExportData(allData[fileName].exports);
    });
    var usedDataFileNames = [];
    var usedDataExports = {};
    var processUsingData = function (targetFileName, fromName) {
        var d = ret[targetFileName];
        if (!d) {
            return false;
        }
        if (typeof (fromName) === 'undefined' || fromName === '*') {
            // all exports are 'used'
            usedDataFileNames.push(targetFileName);
            usedDataExports[targetFileName] = d;
            ret[targetFileName] = [];
            return true;
        }
        else {
            for (var i = d.length - 1; i >= 0; --i) {
                var x = d[i];
                var usedExports = [];
                for (var j = x.namedExports.length - 1; j >= 0; --j) {
                    var named = x.namedExports[j];
                    if (named.name === fromName) {
                        usedExports = usedExports.concat(x.namedExports.splice(j, 1));
                        //break;
                    }
                }
                if (usedExports.length > 0) {
                    var base = usedDataExports[targetFileName];
                    if (!x.namedExports.length) {
                        var a = d.splice(i, 1);
                        a[0].namedExports = usedExports;
                        if (base) {
                            usedDataExports[targetFileName] = base.concat(a);
                        }
                        else {
                            usedDataFileNames.push(targetFileName);
                            usedDataExports[targetFileName] = a;
                        }
                    }
                    else {
                        var newData = {
                            moduleName: x.moduleName,
                            baseName: x.baseName,
                            node: x.node,
                            namedExports: usedExports
                        };
                        if (base) {
                            usedDataExports[targetFileName] = base.concat(newData);
                        }
                        else {
                            usedDataFileNames.push(targetFileName);
                            usedDataExports[targetFileName] = [newData];
                        }
                    }
                    return true;
                }
            }
            return false;
        }
    };
    if (!processUsingData(entryFile, entryExport)) {
        return {};
    }
    var lastUsedDataKeyIndex = 0;
    var _loop_1 = function () {
        var changed = false;
        var i = lastUsedDataKeyIndex;
        lastUsedDataKeyIndex = usedDataFileNames.length;
        var _loop_2 = function () {
            var fileName = usedDataFileNames[i];
            //console.log(`* pickupUnusedExports [current = ${fileName}]`);
            // walk all imports in the file marked 'used'
            // and pick up using modules/exports
            var data = allData[fileName];
            data.imports.forEach(function (imp) {
                if (imp.name) {
                    //console.log(`  * import: name: ${imp.name}, module: ${imp.module}, fromName: ${imp.fromName}`);
                    var importModule = resolveModule_1.default(host, compilerOptions, resolutionCache, imp.module, fileName.replace(/\\/g, '/'));
                    if (importModule) {
                        var importFileName = path.resolve(importModule.resolvedFileName);
                        //console.log(`  * import file: ${importFileName}`);
                        if (allData[importFileName]) {
                            if (processUsingData(importFileName, imp.fromName)) {
                                changed = true;
                            }
                        }
                    }
                }
            });
            data.exports.forEach(function (exp) {
                if (exp.moduleName) {
                    //console.log(`  * export-from: module: ${exp.moduleName}`);
                    var importModule = resolveModule_1.default(host, compilerOptions, resolutionCache, exp.moduleName, fileName.replace(/\\/g, '/'));
                    if (importModule) {
                        var importFileName = path.resolve(importModule.resolvedFileName);
                        //console.log(`  * import file: ${importFileName}`);
                        if (allData[importFileName]) {
                            if (processUsingData(importFileName, void (0))) {
                                changed = true;
                            }
                        }
                    }
                }
            });
        };
        for (; i < usedDataFileNames.length; ++i) {
            _loop_2();
        }
        if (!changed) {
            return "break";
        }
    };
    while (true) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
    Object.keys(ret).forEach(function (s) {
        var a = ret[s];
        if (a.length === 0) {
            delete ret[s];
        }
    });
    return ret;
}
exports.default = pickupUnusedExports;
