"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var mapEntityWithName_1 = require("./mapEntityWithName");
function isDeclarationSymbol(symbol, node) {
    var parent = node.parent;
    if (symbol.flags === ts.SymbolFlags.Alias) {
        return false;
    }
    return !!symbol.declarations && symbol.declarations.some(function (d) { return d === parent; });
}
function isSymbolReferring(symTarget, symReference, nodeReference, outExportedSymbols) {
    if (symReference.flags === ts.SymbolFlags.Alias) {
        if (!symReference.declarations) {
            return false;
        }
        // 'export { A as B };'
        return symReference.declarations.some(function (d) {
            if (ts.isExportSpecifier(d)) {
                var i = d.propertyName || d.name;
                if (i.text === symTarget.name) {
                    outExportedSymbols.push(symTarget);
                    return true;
                }
                return false;
            }
            else {
                return !!symTarget.declarations && symTarget.declarations.some(function (x) { return x === d; });
            }
        });
    }
    else if (!symTarget.declarations || symTarget.name === symReference.name) {
        return false;
    }
    else {
        var node_1 = nodeReference;
        while (node_1) {
            if (symTarget.declarations.some(function (d) { return d === node_1; })) {
                return true;
            }
            node_1 = node_1.parent;
        }
        return false;
    }
}
function reduceNoEntryMap(map, keys, equator, reduceable) {
    var reduced = [];
    while (true) {
        var needMoreReduction = false;
        var _loop_1 = function (i) {
            var t = keys[i];
            var arr = map.get(t);
            if (!arr.length && (!reduceable || reduceable(t))) {
                keys.splice(i, 1);
                map.delete(t);
                reduced.push(t);
                keys.forEach(function (x) {
                    var arr2 = map.get(x);
                    for (var j = arr2.length - 1; j >= 0; --j) {
                        if (equator(arr2[j], t)) {
                            arr2.splice(j, 1);
                        }
                    }
                });
                needMoreReduction = true;
            }
        };
        for (var i = keys.length - 1; i >= 0; --i) {
            _loop_1(i);
        }
        if (!needMoreReduction) {
            break;
        }
    }
    return reduced;
}
function findParentSymbol(symbols, childNode) {
    var _loop_2 = function (i) {
        var x = symbols[i];
        var p = childNode;
        while (p) {
            if (x.declarations && x.declarations.some(function (d) { return d === p; })) {
                return { value: x };
            }
            p = p.parent;
        }
    };
    for (var i = symbols.length - 1; i >= 0; --i) {
        var state_1 = _loop_2(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return undefined;
}
function isUsingExportSymbol(source, sym, unusedExports) {
    if (!unusedExports) {
        return true;
    }
    var symName = sym.name;
    // sym.name may be 'default', so get original entity name
    if (sym.declarations) {
        sym.declarations.forEach(function (d) {
            mapEntityWithName_1.default(function (_n, exportName, baseName, i) {
                if (i === 0) {
                    symName = baseName || exportName;
                }
            }, d, source);
        });
    }
    return !unusedExports.some(function (exp) {
        return exp.namedExports.some(function (x) {
            return (x.baseName || x.name) === symName;
        });
    });
}
function collectUnusedSymbols(sourceFile, typeChecker, unusedExports) {
    var symbols = new Map();
    var symKeys = [];
    var exportedSymKeys = [];
    function processNode(node) {
        var baseSym = typeChecker.getSymbolAtLocation(node);
        if (baseSym) {
            //const s = typeChecker.getAliasedSymbol(baseSym);
            var s_1 = baseSym;
            if (isDeclarationSymbol(s_1, node)) {
                var parentSymbol = void 0;
                if (s_1.getFlags() === ts.SymbolFlags.Method ||
                    s_1.getFlags() === ts.SymbolFlags.Property ||
                    s_1.getFlags() === ts.SymbolFlags.NamespaceModule) {
                    parentSymbol = findParentSymbol(symKeys, node);
                }
                if (!symbols.get(s_1)) {
                    //console.log('Declaration symbol:', s.name);
                    symbols.set(s_1, []);
                    symKeys.push(s_1);
                }
                if (parentSymbol) {
                    //console.log(`  (found parent symbol: ${parentSymbol.name})`);
                    // 'parent (parentSymbol) is referring child (s)'
                    var arr = symbols.get(s_1);
                    arr.push(parentSymbol);
                }
            }
            else {
                //console.log('Reference symbol:', s.name);
                symKeys.forEach(function (x) {
                    if (isSymbolReferring(x, s_1, node, exportedSymKeys)) {
                        //console.log(`  (found declaration: ${x.name})`);
                        // 'x' is referring 's'
                        var arr = symbols.get(s_1);
                        if (arr) {
                            arr.push(x);
                        }
                    }
                });
            }
        }
        node.forEachChild(processNode);
    }
    sourceFile.forEachChild(processNode);
    //console.log(`collectUnusedSymbols [file = ${sourceFile.fileName}]`);
    //console.log(`  unused exports:`);
    //unusedExports && unusedExports.forEach((exp) => exp.namedExports.forEach((x) => console.log(`    ${x.baseName || x.name} as ${x.name}`)));
    return reduceNoEntryMap(symbols, symKeys, function (a, b) { return a.name === b.name; }, function (s) {
        var usingExport = isUsingExportSymbol(sourceFile, s, unusedExports);
        if (!s.declarations) {
            return true;
        }
        //console.log(`  Symbol '${s.name}'[${s.flags}]: usingExport = `, usingExport);
        if (usingExport && exportedSymKeys.some(function (x) { return x === s; })) {
            return false;
        }
        var d = s.declarations[0];
        if (!d) {
            return true;
        }
        return !usingExport || !(ts.isExportDeclaration(d) ||
            ts.isExportAssignment(d) ||
            ts.isExportSpecifier(d) ||
            (d.modifiers && d.modifiers.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; })));
    }).map(function (sym) {
        var name = sym.name;
        if (sym.declarations) {
            sym.declarations.forEach(function (d) {
                mapEntityWithName_1.default(function (_n, exportName, baseName, i) {
                    if (i === 0) {
                        name = baseName || exportName;
                    }
                }, d, sourceFile);
            });
        }
        return name;
    });
}
exports.default = collectUnusedSymbols;
