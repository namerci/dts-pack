"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
var getModuleName_1 = require("./getModuleName");
var getModuleNameFromSpecifier_1 = require("../core/getModuleNameFromSpecifier");
var getNodeWithStrippedExports_1 = require("../core/getNodeWithStrippedExports");
var isEqualPath_1 = require("../utils/isEqualPath");
var createStringLiteral_1 = require("./createStringLiteral");
var resolveModule_1 = require("./resolveModule");
function filterNonNull(array) {
    return array.filter(function (value) { return value !== null; });
}
function containsSourceFile(sourceFiles, fileName) {
    return sourceFiles.some(function (sourceFile) { return isEqualPath_1.default(path.resolve(sourceFile.fileName), fileName); });
}
function makeChildModuleName(baseModuleName, baseModulePath, resolvedFileName, options) {
    var childModuleName = getModuleName_1.default(baseModulePath, resolvedFileName);
    if (!options.childModuleNameConverter) {
        return baseModuleName + "/" + childModuleName;
    }
    // @ts-ignore 2695
    return (0, options.childModuleNameConverter)(baseModuleName, childModuleName, resolvedFileName);
}
function makeChildModule(options, sourceFile, sourceFiles, baseModulePath, baseModuleName, host, compilerOptions, resolutionCache, stripUnusedExports) {
    var moduleName = makeChildModuleName(baseModuleName, baseModulePath, sourceFile.fileName, options);
    var resolvedFileName = path.resolve(sourceFile.fileName);
    var statements = filterNonNull(sourceFile.statements.map(function (node) {
        if (stripUnusedExports) {
            var s = getNodeWithStrippedExports_1.default(sourceFile, resolvedFileName, node, stripUnusedExports);
            if (s === null) {
                return null;
            }
            // strip if no exports are specified in 'export { ... }'
            if (ts.isExportDeclaration(s)) {
                if (s.exportClause && s.exportClause.elements.length === 0) {
                    return null;
                }
            }
            node = s;
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
            if (ts.isImportDeclaration(node) ||
                (ts.isExportDeclaration(node) && node.moduleSpecifier)) {
                var m = resolveModule_1.default(host, compilerOptions, resolutionCache, getModuleNameFromSpecifier_1.default(node.moduleSpecifier), sourceFile.fileName);
                if (m && containsSourceFile(sourceFiles, m.resolvedFileName)) {
                    var refModule = makeChildModuleName(baseModuleName, baseModulePath, m.resolvedFileName, options);
                    //return ts.createImportDeclaration(
                    //	node.decorators,
                    //	node.modifiers,
                    //	node.importClause,
                    //	createStringLiteral(refModule)
                    //);
                    node.moduleSpecifier = createStringLiteral_1.default(refModule);
                }
            }
            else if (ts.isImportEqualsDeclaration(node)) {
                var ex = node.moduleReference;
                if (ts.isExternalModuleReference(ex) && ex.expression) {
                    var m = resolveModule_1.default(host, compilerOptions, resolutionCache, getModuleNameFromSpecifier_1.default(ex.expression), sourceFile.fileName);
                    if (m && containsSourceFile(sourceFiles, m.resolvedFileName)) {
                        var refModule = makeChildModuleName(baseModuleName, baseModulePath, m.resolvedFileName, options);
                        //return ts.createImportEqualsDeclaration(
                        //	node.decorators,
                        //	node.modifiers,
                        //	node.name,
                        //	ts.createExternalModuleReference(createStringLiteral(refModule))
                        //);
                        node.moduleReference = ts.createExternalModuleReference(createStringLiteral_1.default(refModule));
                    }
                }
            }
            if (node.modifiers) {
                // remove 'declare' keyword
                var mods = node.modifiers
                    .filter(function (m) { return (m.kind !== ts.SyntaxKind.DeclareKeyword); });
                if (mods.length !== node.modifiers.length) {
                    node.modifiers = ts.createNodeArray(mods);
                }
            }
        }
        return node;
    }));
    if (!statements.length) {
        return null;
    }
    var outModuleBlock = ts.createModuleBlock(statements);
    var outModule = ts.createModuleDeclaration(undefined, ts.createNodeArray([ts.createToken(ts.SyntaxKind.DeclareKeyword)]), createStringLiteral_1.default(moduleName), outModuleBlock);
    return { name: moduleName, module: outModule };
}
exports.default = makeChildModule;
