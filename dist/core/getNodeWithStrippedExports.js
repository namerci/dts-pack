"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var mapEntityWithName_1 = require("./mapEntityWithName");
function getNodeWithStrippedExports(sourceFile, resolvedFileName, node, stripUnusedExports) {
    var a = stripUnusedExports[resolvedFileName];
    if (!a || !a.length) {
        return node;
    }
    if (ts.isExportDeclaration(node)) {
        if (node.exportClause) {
            var newElem = node.exportClause.elements.filter(function (element) {
                return !a.some(function (exp) {
                    return exp.namedExports.some(function (x) { return element.name.text === (x.baseName || x.name); });
                });
            });
            if (!newElem.length) {
                return null;
            }
            if (newElem.length < node.exportClause.elements.length) {
                node.exportClause.elements = ts.createNodeArray(newElem);
            }
        }
    }
    else if (ts.isExportAssignment(node) && !node.isExportEquals) {
        if (a.some(function (exp) { return exp.namedExports.some(function (x) { return 'default' === x.name; }); })) {
            return null;
        }
    }
    else if (node.modifiers && node.modifiers.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; })) {
        if (ts.isVariableStatement(node)) {
            var decls = node.declarationList.declarations.filter(function (decl) { return !a.some(function (exp) { return exp.namedExports.some(function (x) { return decl.name.getText(sourceFile) === (x.baseName || x.name); }); }); });
            if (decls.length === 0) {
                return null;
            }
            else if (decls.length < node.declarationList.declarations.length) {
                node.declarationList.declarations = ts.createNodeArray(decls);
            }
        }
        else {
            var names_1 = mapEntityWithName_1.default(function (_n, _e, baseName) {
                return baseName || null;
            }, node, sourceFile);
            if (names_1[0] !== null) {
                if (a.some(function (exp) { return exp.namedExports.some(function (x) { return names_1[0] === (x.baseName || x.name); }); })) {
                    return null;
                }
            }
        }
    }
    return node;
}
exports.default = getNodeWithStrippedExports;
