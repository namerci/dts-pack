"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var collectImportsAndExports_1 = require("../core/collectImportsAndExports");
var collectUnusedSymbols_1 = require("../core/collectUnusedSymbols");
var pickupUnusedExports_1 = require("../core/pickupUnusedExports");
var resolveModule_1 = require("./resolveModule");
function outputImportsAndExports(messageWriter, _econf, host, compilerOptions, resolutionCache, fileName, data) {
    messageWriter("File '" + fileName + "':");
    messageWriter('  Imports:');
    data.imports.forEach(function (x) {
        var resolved = resolveModule_1.default(host, compilerOptions, resolutionCache, x.module, fileName);
        if (resolved) {
            messageWriter("    from '" + x.module + "' [" + resolved.resolvedFileName + "]:");
        }
        else {
            messageWriter("    from '" + x.module + "':");
        }
        if (!x.name) {
            messageWriter('      (no bindings)');
        }
        else if (!x.fromName) {
            messageWriter("      --> " + x.name + " (alias)");
        }
        else if (x.fromName === '*') {
            messageWriter("      <as namespace> " + x.name);
        }
        else {
            messageWriter("      " + x.fromName + " --> " + x.name);
        }
    });
    messageWriter('  Exports:');
    data.exports.forEach(function (x) {
        if (x.baseName) {
            messageWriter("    = " + x.baseName);
        }
        else {
            var indent_1 = '';
            if (x.moduleName) {
                var resolved = resolveModule_1.default(host, compilerOptions, resolutionCache, x.moduleName, fileName);
                if (resolved) {
                    messageWriter("    <from '" + x.moduleName + "' [" + resolved.resolvedFileName + "]>");
                }
                else {
                    messageWriter("    <from '" + x.moduleName + "'>");
                }
                indent_1 = '  ';
            }
            if (!x.namedExports.length) {
                messageWriter("    " + indent_1 + "*");
            }
            else {
                x.namedExports.forEach(function (e) {
                    messageWriter("    " + indent_1 + (e.baseName || e.name) + " as " + e.name);
                });
            }
        }
    });
}
function printImportsAndExports(messageWriter, options, econf, projectFile, sourceFiles, host, compilerOptions, resolutionCache, program) {
    //writer(`Files: ${sourceFiles.map((src) => src.fileName).join(econf.lineBreak + '  ')}:`);
    var map = {};
    sourceFiles.forEach(function (file) {
        var rx = collectImportsAndExports_1.default(file);
        map[path.resolve(file.fileName)] = rx;
        outputImportsAndExports(messageWriter, econf, host, compilerOptions, resolutionCache, file.fileName, rx);
        messageWriter('');
    });
    if (options.entry) {
        var baseUrl = compilerOptions.baseUrl || '.';
        var basePath = path.resolve(path.dirname(projectFile), baseUrl);
        var entryFileName = path.resolve(basePath, options.entry);
        var r_1 = pickupUnusedExports_1.default(entryFileName, options.export, map, host, compilerOptions, resolutionCache);
        var retKeys = Object.keys(r_1);
        if (retKeys.length > 0) {
            messageWriter('Unused exports:');
            sourceFiles.forEach(function (sourceFile) {
                var fileName = path.resolve(sourceFile.fileName);
                var a = r_1[fileName];
                if (a) {
                    var unusedSymbols_1 = collectUnusedSymbols_1.default(sourceFile, program.getTypeChecker(), a);
                    a = a.filter(function (exp) {
                        exp.namedExports = exp.namedExports.filter(function (x) {
                            var s = x.baseName || x.name;
                            return unusedSymbols_1.some(function (sym) { return sym === s; });
                        });
                        return exp.namedExports.length > 0;
                    });
                    if (a.length > 0) {
                        messageWriter("  " + fileName + ":");
                        if (a.length === map[fileName].exports.length) {
                            messageWriter('    <all exports are unused>');
                        }
                        else {
                            a.forEach(function (x) {
                                x.namedExports.forEach(function (named) {
                                    messageWriter("    " + (named.baseName || named.name));
                                });
                            });
                        }
                    }
                }
            });
        }
    }
}
exports.default = printImportsAndExports;
