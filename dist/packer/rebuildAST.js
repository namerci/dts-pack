"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var path = require("path");
var getNodeWithStrippedExports_1 = require("../core/getNodeWithStrippedExports");
var isEqualPath_1 = require("../utils/isEqualPath");
var getIdentifierName_1 = require("./getIdentifierName");
var getNamespaceName_1 = require("./getNamespaceName");
var resolveModule_1 = require("./resolveModule");
function containsSourceFile(sourceFiles, fileName) {
    return sourceFiles.some(function (sourceFile) { return isEqualPath_1.default(path.resolve(sourceFile.fileName), fileName); });
}
function getImportData(data, node) {
    return data.imports.filter(function (x) { return x.node === node; });
}
function getExternalImportModuleData(options, resolvedName, moduleName, externalImportData, assign) {
    var prefix = options.importBindingName || '__module';
    var x = externalImportData.modules[resolvedName];
    if (!x) {
        x = {
            name: "" + prefix + ++externalImportData.importedCount,
            module: moduleName
        };
        externalImportData.modules[resolvedName] = x;
    }
    else if (assign && !x.name) {
        x.name = "" + prefix + ++externalImportData.importedCount;
    }
    return x;
}
function gatherAllExportEntities(options, moduleFullPath, allData) {
    var dataMap = allData.filter(function (d) { return isEqualPath_1.default(d.sourceFile.fileName, moduleFullPath); })[0];
    if (!dataMap)
        return null;
    var r = [];
    dataMap.data.exports.forEach(function (x) {
        if (!r)
            return;
        if (x.namedExports && x.namedExports.length) {
            r = r.concat(x.namedExports.map(function (n) { return getIdentifierName_1.default(n.name, options); }));
        }
        else {
            // 'export = XXX'
            r = null;
        }
    });
    return r;
}
function gatherAllExportEntitiesFromExternalModule(resolvedFileName, program) {
    var src = program.getSourceFile(resolvedFileName);
    if (!src) {
        return null;
    }
    var checker = program.getTypeChecker();
    var moduleSymbol = checker.getSymbolAtLocation(src);
    if (!moduleSymbol) {
        return null;
    }
    var r = checker.getExportsOfModule(moduleSymbol);
    return r.map(function (s) { return s.name; });
}
function rebuildAST(options, sourceFile, sourceFiles, basePath, allData, externalImportData, outGlobals, host, program, compilerOptions, resolutionCache, stripUnusedExports) {
    var resolvedFileName = path.resolve(sourceFile.fileName);
    var namespaceName = getNamespaceName_1.default(basePath, sourceFile.fileName, options);
    var n = ts.createIdentifier(namespaceName);
    var dataMap = allData.filter(function (d) { return (d.sourceFile === sourceFile); })[0];
    if (!dataMap) {
        return null;
    }
    var data = dataMap.data;
    var localImportData = {};
    var moduleStatements = [];
    sourceFile.forEachChild(function (node) {
        if (stripUnusedExports) {
            var n_1 = getNodeWithStrippedExports_1.default(sourceFile, resolvedFileName, node, stripUnusedExports);
            if (n_1 === null) {
                return;
            }
            node = n_1;
        }
        if (ts.isFunctionDeclaration(node) ||
            ts.isMissingDeclaration(node) ||
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isModuleDeclaration(node) ||
            ts.isImportEqualsDeclaration(node) ||
            ts.isNamespaceExportDeclaration(node) ||
            ts.isExportDeclaration(node) ||
            ts.isExportAssignment(node) ||
            ts.isVariableStatement(node) ||
            ts.isImportDeclaration(node)) {
            var replaced = false;
            if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
                var i = getImportData(data, node);
                if (i && i.length) {
                    i.forEach(function (d) {
                        var m = resolveModule_1.default(host, compilerOptions, resolutionCache, d.module, sourceFile.fileName);
                        if (m) {
                            if (containsSourceFile(sourceFiles, m.resolvedFileName)) {
                                if (d.name) {
                                    var refNamespace = getNamespaceName_1.default(basePath, m.resolvedFileName, options);
                                    if (d.fromName && d.fromName !== '*') {
                                        refNamespace = refNamespace + "." + getIdentifierName_1.default(d.fromName, options);
                                    }
                                    var decl = ts.createImportEqualsDeclaration(undefined, undefined, ts.createIdentifier(d.name), ts.createIdentifier(refNamespace));
                                    localImportData[d.name] = refNamespace;
                                    moduleStatements.push(decl);
                                }
                            }
                            else {
                                var x = getExternalImportModuleData(options, m.resolvedFileName, d.module, externalImportData, !!d.name);
                                if (d.name) {
                                    var refNamespace = void 0;
                                    if (d.fromName === '*') {
                                        refNamespace = "" + x.name;
                                    }
                                    else {
                                        refNamespace = x.name + "." + getIdentifierName_1.default(d.fromName, options);
                                    }
                                    var decl = ts.createImportEqualsDeclaration(undefined, undefined, ts.createIdentifier(d.name), ts.createIdentifier(refNamespace));
                                    localImportData[d.name] = refNamespace;
                                    moduleStatements.push(decl);
                                }
                            }
                        }
                    });
                }
                replaced = true;
            }
            else if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
                replaced = true;
            }
            else if (ts.isModuleDeclaration(node)) {
                if (node.flags & ts.NodeFlags.GlobalAugmentation) {
                    outGlobals.push({
                        sourceFile: sourceFile,
                        node: node
                    });
                    replaced = true;
                }
            }
            if (!replaced) {
                // remove 'export' 'declare' 'default' keywords
                if (node.modifiers) {
                    var mods = node.modifiers
                        .filter(function (m) { return (m.kind !== ts.SyntaxKind.ExportKeyword &&
                        m.kind !== ts.SyntaxKind.DeclareKeyword &&
                        m.kind !== ts.SyntaxKind.DefaultKeyword); });
                    if (mods.length !== node.modifiers.length) {
                        node.modifiers = ts.createNodeArray(mods);
                    }
                }
                moduleStatements.push(node);
            }
        }
    });
    var innerModuleBlock = ts.createModuleBlock(moduleStatements);
    innerModuleBlock.statements.forEach(function (s) {
        s.parent = innerModuleBlock;
    });
    var innerModuleName = ts.createIdentifier('module');
    var innerModule = ts.createModuleDeclaration(undefined, [], innerModuleName, innerModuleBlock, ts.NodeFlags.Namespace);
    var outerStatements = [innerModule];
    data.exports.forEach(function (d) {
        if (d.moduleName) {
            var m = resolveModule_1.default(host, compilerOptions, resolutionCache, d.moduleName, sourceFile.fileName);
            if (m) {
                if (!m.isExternalLibraryImport) {
                    var names = gatherAllExportEntities(options, m.resolvedFileName, allData);
                    if (names) {
                        var refNamespace_1 = getNamespaceName_1.default(basePath, m.resolvedFileName, options);
                        names.forEach(function (name) {
                            var fromIdentifier = ts.createIdentifier(refNamespace_1 + "." + name);
                            var exportIdentifier = ts.createIdentifier(name);
                            var exp = ts.createImportEqualsDeclaration(undefined, [ts.createToken(ts.SyntaxKind.ExportKeyword)], exportIdentifier, fromIdentifier);
                            outerStatements.push(exp);
                        });
                    }
                }
                else {
                    var names = gatherAllExportEntitiesFromExternalModule(m.resolvedFileName, program);
                    if (names) {
                        var x = getExternalImportModuleData(options, m.resolvedFileName, d.moduleName, externalImportData, true);
                        var refNamespace_2 = x.name;
                        names.forEach(function (name) {
                            var fromIdentifier = ts.createIdentifier(refNamespace_2 + "." + name);
                            var exportIdentifier = ts.createIdentifier(name);
                            var exp = ts.createImportEqualsDeclaration(undefined, [ts.createToken(ts.SyntaxKind.ExportKeyword)], exportIdentifier, fromIdentifier);
                            outerStatements.push(exp);
                        });
                    }
                }
            }
        }
        else if (d.baseName) {
        }
        else {
            d.namedExports.forEach(function (m) {
                var name = getIdentifierName_1.default(m.name, options);
                var fromName = m.baseName || name;
                var fromIdentifier;
                if (localImportData[fromName]) {
                    fromIdentifier = ts.createIdentifier(localImportData[fromName]);
                }
                else {
                    fromIdentifier = ts.createIdentifier("module." + fromName);
                }
                var exportIdentifier = ts.createIdentifier(name);
                var exp = ts.createImportEqualsDeclaration(undefined, [ts.createToken(ts.SyntaxKind.ExportKeyword)], exportIdentifier, fromIdentifier);
                outerStatements.push(exp);
            });
        }
    });
    var outerModuleBlock = ts.createModuleBlock(outerStatements);
    outerModuleBlock.statements.forEach(function (s) {
        s.parent = outerModuleBlock;
    });
    var outerModule = ts.createModuleDeclaration(undefined, [ts.createToken(ts.SyntaxKind.DeclareKeyword)], n, outerModuleBlock, ts.NodeFlags.Namespace);
    return outerModule;
}
exports.default = rebuildAST;
