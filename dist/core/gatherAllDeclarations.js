"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
var isChildPath_1 = require("../utils/isChildPath");
function convertDeclFileNameToSourceFileName(compilerOptions, projectFile, declFile) {
    declFile = declFile.replace(/\.d(\.ts)$/i, '$1');
    var declOutDir = compilerOptions.declarationDir;
    if (typeof declOutDir === 'undefined') {
        declOutDir = compilerOptions.outDir;
        if (typeof declOutDir === 'undefined') {
            // output directory seems to be same as the project directory
            return path.resolve(path.dirname(projectFile), declFile);
        }
    }
    var baseUrl = compilerOptions.baseUrl || '.';
    var basePath = path.resolve(path.dirname(projectFile), baseUrl);
    declOutDir = path.resolve(basePath, declOutDir);
    if (!isChildPath_1.default(declOutDir, declFile)) {
        return declFile;
    }
    return path.resolve(basePath, path.relative(declOutDir, declFile));
}
function gatherAllDeclarations(inputFiles, tsProgram, projectFile, compilerOptions, checkInputs) {
    var r = {};
    var diag = [];
    var writeFile = function (fileName, data) {
        if (!/\.d\.ts$/i.test(fileName)) {
            return;
        }
        // set source file to the original file name instead of declaration file
        var srcFileName = convertDeclFileNameToSourceFileName(compilerOptions, projectFile, fileName);
        r[srcFileName] = data;
    };
    var inputFileNames;
    if (inputFiles && (inputFileNames = Object.keys(inputFiles)).length > 0) {
        inputFileNames.forEach(function (name) {
            if (checkInputs) {
                var src = ts.createSourceFile(name, inputFiles[name], compilerOptions.target || ts.ScriptTarget.ES5, true);
                var emitResult = tsProgram.emit(src, writeFile);
                diag = diag.concat(emitResult.diagnostics);
            }
            else {
                var srcFileName = convertDeclFileNameToSourceFileName(compilerOptions, projectFile, name);
                r[srcFileName] = inputFiles[name];
            }
        });
    }
    else {
        tsProgram.getSourceFiles().forEach(function (src) {
            var emitResult = tsProgram.emit(src, writeFile);
            diag = diag.concat(emitResult.diagnostics);
        });
    }
    var hasError = diag.some(function (d) { return d.category === ts.DiagnosticCategory.Error; });
    return {
        files: diag.length > 0 ? {} : r,
        diagnostics: diag,
        hasError: hasError
    };
}
exports.default = gatherAllDeclarations;
