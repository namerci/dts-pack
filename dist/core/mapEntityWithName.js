"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function mapEntityWithName(mapCallback, node, source) {
    var isDefault = node.modifiers && node.modifiers.some(function (m) { return m.kind === ts.SyntaxKind.DefaultKeyword; });
    if (ts.isVariableStatement(node)) {
        return node.declarationList.declarations.map(function (d, i) { return mapCallback(d, d.name.getText(source), undefined, i); });
    }
    else if (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isModuleDeclaration(node)) {
        var baseName = node.name && node.name.text;
        return [mapCallback(node, (isDefault || !node.name) ? 'default' : baseName, baseName, 0)];
    }
    else if (ts.isImportEqualsDeclaration(node)) {
        return [mapCallback(node, node.name.text, undefined, 0)];
    }
    else {
        return [];
    }
}
exports.default = mapEntityWithName;
