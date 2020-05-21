"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
var isEqualPath_1 = require("../utils/isEqualPath");
var pickupRootPath_1 = require("../utils/pickupRootPath");
var collectImportsAndExports_1 = require("../core/collectImportsAndExports");
var collectUnusedSymbols_1 = require("../core/collectUnusedSymbols");
var pickupUnusedExports_1 = require("../core/pickupUnusedExports");
var getIdentifierName_1 = require("./getIdentifierName");
var getNamespaceName_1 = require("./getNamespaceName");
var makeChildModule_1 = require("./makeChildModule");
var rebuildAST_1 = require("./rebuildAST");
function isEqualEntryFile(source, entryFileName) {
    var f = source.fileName;
    if (isEqualPath_1.default(f, entryFileName))
        return true;
    var r;
    if ((r = /\.d(\.ts)$/i.exec(f))) {
        f = f.substr(0, f.length - r[0].length) + r[1];
        if (isEqualPath_1.default(f, entryFileName))
            return true;
    }
    var p = path.parse(path.normalize(f));
    p.ext = '';
    p.base = '';
    return isEqualPath_1.default(path.format(p), entryFileName);
}
function determineBaseModulePath(_entryBasePath, sourceFiles) {
    if (!sourceFiles.length) {
        return '';
    }
    return sourceFiles.reduce(function (prev, current) {
        var dirName = path.dirname(path.normalize(current.fileName));
        if (prev === null) {
            return dirName;
        }
        if (!prev) {
            return prev;
        }
        return pickupRootPath_1.default(prev, dirName);
    }, null);
}
function createDefaultHeaderFooterCallback(text) {
    return function (data) {
        var now = new Date();
        var outputName = path.basename(data.outputFileName);
        return text.replace(/\[([A-Za-z0-9\_\-]+?)\]/g, function (substring, p1) {
            switch (true) {
                case p1 === 'name':
                    return outputName;
                case p1 === 'module':
                    return data.moduleName;
                case p1 === 'year':
                    return now.getFullYear().toString();
                case p1 === 'year2':
                    return now.getFullYear().toString().substr(-2, 2);
                case p1 === 'month':
                    return (now.getMonth() + 1).toString();
                case p1 === 'month2':
                    return ('0' + (now.getMonth() + 1).toString()).substr(-2, 2);
                case p1 === 'day':
                    return now.getDate().toString();
                case p1 === 'day2':
                    return ('0' + now.getDate().toString()).substr(-2, 2);
            }
            return substring;
        });
    };
}
function getHeaderFooterText(isHeader, callback, data, isRaw) {
    if (!callback)
        return [];
    var d = callback(data);
    if (d === null || typeof d === 'undefined')
        return [];
    d = '' + d;
    return isRaw ? [d] : [isHeader ? '/*!' : '/*'].concat(d.toString().replace(/\r\n/mg, '\n').split(/[\r\n]/g).map(function (s) { return (" * " + s).replace(/\s*$/g, ''); })).concat(' */');
}
function outputFiles(options, econf, projectFile, sourceFiles, host, compilerOptions, resolutionCache, program) {
    var baseUrl = compilerOptions.baseUrl || '.';
    var entryBasePath = path.resolve(path.dirname(projectFile), baseUrl);
    var basePath = determineBaseModulePath(entryBasePath, sourceFiles);
    var entryFileName = path.resolve(entryBasePath, options.entry);
    var outDir = options.outDir || './';
    var warnings = '';
    var files = {};
    if (!sourceFiles.some(function (src) { return isEqualEntryFile(src, entryFileName); })) {
        throw "dts-pack: ERROR: entry file '" + options.entry + "' is not found.";
    }
    var printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed
    });
    var stripUnusedExports;
    if (options.stripUnusedExports) {
        var map_1 = {};
        sourceFiles.forEach(function (file) {
            var rx = collectImportsAndExports_1.default(file);
            map_1[path.resolve(file.fileName)] = rx;
        });
        stripUnusedExports = pickupUnusedExports_1.default(entryFileName, options.export, map_1, host, compilerOptions, resolutionCache);
        sourceFiles = sourceFiles.filter(function (file) {
            var fileName = path.resolve(file.fileName);
            var a = stripUnusedExports[fileName];
            if (a) {
                var unusedSymbols_1 = collectUnusedSymbols_1.default(file, program.getTypeChecker(), a);
                a = a.filter(function (exp) {
                    exp.namedExports = exp.namedExports.filter(function (x) {
                        var s = x.baseName || x.name;
                        return unusedSymbols_1.some(function (sym) { return sym === s; });
                    });
                    return exp.namedExports.length > 0;
                });
                if (!a.length) {
                    delete stripUnusedExports[fileName];
                    return true;
                }
                stripUnusedExports[fileName] = a;
            }
            return !a || a.length !== map_1[fileName].exports.length;
        });
    }
    var headerCallback = (typeof options.headerText === 'string' ?
        createDefaultHeaderFooterCallback(options.headerText) :
        options.headerText);
    var footerCallback = (typeof options.footerText === 'string' ?
        createDefaultHeaderFooterCallback(options.footerText) :
        options.footerText);
    if (options.style !== 'namespace') {
        var mainDeclFileName = path.join(outDir, options.moduleName, "index.d.ts");
        var childDeclFileName = path.join(outDir, options.moduleName, options.moduleName + ".d.ts");
        var mainDeclOutputs = getHeaderFooterText(true, headerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: mainDeclFileName
        }, options.isHeaderFooterRawText);
        var childDeclOutputs_1 = getHeaderFooterText(true, headerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: childDeclFileName
        }, options.isHeaderFooterRawText);
        var entryModule_1 = '';
        sourceFiles.forEach(function (file) {
            var m = makeChildModule_1.default(options, file, sourceFiles, basePath, options.moduleName, host, compilerOptions, resolutionCache, stripUnusedExports);
            if (m === null) {
                return;
            }
            childDeclOutputs_1.push(printer.printNode(ts.EmitHint.Unspecified, m.module, file));
            childDeclOutputs_1.push('');
            if (isEqualEntryFile(file, entryFileName)) {
                entryModule_1 = m.name;
            }
        });
        var expFrom = options.export ? "." + options.export : '';
        var dummyModuleName = options.importBindingName || '__module';
        mainDeclOutputs.push("/// <reference path='./" + options.moduleName + ".d.ts' />");
        mainDeclOutputs.push('');
        mainDeclOutputs.push("import " + dummyModuleName + " = require('" + entryModule_1 + "');");
        mainDeclOutputs.push("export = " + dummyModuleName + expFrom + ";");
        if (options.rootName) {
            var parentNamespaces = options.rootName.split('.');
            var targetNamespace = parentNamespaces.splice(parentNamespaces.length - 1, 1)[0];
            if (parentNamespaces.length > 0) {
                mainDeclOutputs.push('');
                mainDeclOutputs.push('declare global {');
                mainDeclOutputs.push("    namespace " + parentNamespaces.join('.') + " {");
                mainDeclOutputs.push("        export import " + targetNamespace + " = " + dummyModuleName + expFrom + ";");
                mainDeclOutputs.push('    }');
                mainDeclOutputs.push('}');
            }
            else {
                mainDeclOutputs.push("export as namespace " + targetNamespace + ";");
                if (options.forceDefineGlobal) {
                    mainDeclOutputs.push('');
                    mainDeclOutputs.push('declare global {');
                    mainDeclOutputs.push("    var " + targetNamespace + ": typeof " + dummyModuleName + expFrom + ";");
                    mainDeclOutputs.push('}');
                }
            }
        }
        mainDeclOutputs.push('');
        mainDeclOutputs.push.apply(mainDeclOutputs, getHeaderFooterText(false, footerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: mainDeclFileName
        }, options.isHeaderFooterRawText));
        childDeclOutputs_1.push.apply(childDeclOutputs_1, getHeaderFooterText(false, footerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: childDeclFileName
        }, options.isHeaderFooterRawText));
        files[childDeclFileName] = childDeclOutputs_1.join(econf.lineBreak);
        files[mainDeclFileName] = mainDeclOutputs.join(econf.lineBreak);
    }
    else {
        var declFileName = path.join(outDir, options.moduleName + ".d.ts");
        var outputs_1 = [];
        var externalImportData_1 = {
            modules: {},
            importedCount: 0
        };
        var allData_1 = sourceFiles.map(function (file) {
            var rx = collectImportsAndExports_1.default(file);
            return {
                sourceFile: file,
                data: rx
            };
        });
        var globals_1 = [];
        allData_1.forEach(function (d) {
            var file = d.sourceFile;
            var st = rebuildAST_1.default(options, file, sourceFiles, basePath, allData_1, externalImportData_1, globals_1, host, program, compilerOptions, resolutionCache, stripUnusedExports);
            if (st) {
                st.parent = file;
                //statements.push(st);
                outputs_1.push(printer.printNode(ts.EmitHint.Unspecified, st, file));
            }
        });
        if (globals_1.length) {
            outputs_1 = globals_1.map(function (d) { return printer.printNode(ts.EmitHint.Unspecified, d.node, d.sourceFile); })
                .concat('')
                .concat(outputs_1);
        }
        if (externalImportData_1.importedCount) {
            var modules_1 = externalImportData_1.modules;
            outputs_1 = Object.keys(modules_1).map(function (key) {
                var m = modules_1[key];
                return "import * as " + m.name + " from '" + m.module + "';";
            }).concat('').concat(outputs_1);
        }
        var exportName = void 0;
        if (options.export) {
            exportName = getNamespaceName_1.default(basePath, entryFileName, options) + "." + getIdentifierName_1.default(options.export, options);
        }
        else {
            exportName = getNamespaceName_1.default(basePath, entryFileName, options);
        }
        outputs_1.push("export = " + exportName + ";");
        if (options.rootName) {
            var parentNamespaces = options.rootName.split('.');
            var targetNamespace = parentNamespaces.splice(parentNamespaces.length - 1, 1)[0];
            if (parentNamespaces.length > 0) {
                outputs_1.push('');
                outputs_1.push('declare global {');
                outputs_1.push("    namespace " + parentNamespaces.join('.') + " {");
                outputs_1.push("        export import " + targetNamespace + " = " + exportName + ";");
                outputs_1.push('    }');
                outputs_1.push('}');
            }
            else {
                outputs_1.push("export as namespace " + targetNamespace + ";");
                if (options.forceDefineGlobal) {
                    outputs_1.push('');
                    outputs_1.push('declare global {');
                    outputs_1.push("    var " + targetNamespace + ": typeof " + exportName + ";");
                    outputs_1.push('}');
                }
            }
        }
        outputs_1.push('');
        outputs_1 = getHeaderFooterText(true, headerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: declFileName
        }, options.isHeaderFooterRawText).concat(outputs_1);
        outputs_1 = outputs_1.concat(getHeaderFooterText(false, footerCallback, {
            entryFileName: entryFileName,
            moduleName: options.moduleName,
            projectFile: projectFile,
            outputFileName: declFileName
        }, options.isHeaderFooterRawText));
        files[declFileName] = outputs_1.join(econf.lineBreak);
    }
    return { files: files, warnings: warnings };
}
exports.default = outputFiles;
