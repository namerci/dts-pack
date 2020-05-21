"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var path = require("path");
var CompilerHostForMemoryFiles = /** @class */ (function () {
    function CompilerHostForMemoryFiles(files, baseHost) {
        this.files = files;
        this.baseHost = baseHost;
        this.writeFile = baseHost.writeFile;
    }
    CompilerHostForMemoryFiles.prototype.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
        var f = path.resolve(fileName);
        var source = this.files[f];
        if (typeof (source) === 'string') {
            return ts.createSourceFile(fileName, source, languageVersion);
        }
        return this.baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };
    CompilerHostForMemoryFiles.prototype.getDefaultLibFileName = function (options) {
        return this.baseHost.getDefaultLibFileName(options);
    };
    CompilerHostForMemoryFiles.prototype.getCurrentDirectory = function () {
        return this.baseHost.getCurrentDirectory();
    };
    CompilerHostForMemoryFiles.prototype.getDirectories = function (path) {
        return this.baseHost.getDirectories(path);
    };
    CompilerHostForMemoryFiles.prototype.getCanonicalFileName = function (fileName) {
        return this.baseHost.getCanonicalFileName(fileName);
    };
    CompilerHostForMemoryFiles.prototype.useCaseSensitiveFileNames = function () {
        return this.baseHost.useCaseSensitiveFileNames();
    };
    CompilerHostForMemoryFiles.prototype.getNewLine = function () {
        return this.baseHost.getNewLine();
    };
    CompilerHostForMemoryFiles.prototype.fileExists = function (fileName) {
        var f = path.resolve(fileName);
        var source = this.files[f];
        if (typeof (source) === 'string') {
            return true;
        }
        return this.baseHost.fileExists(fileName);
    };
    CompilerHostForMemoryFiles.prototype.readFile = function (fileName) {
        var f = path.resolve(fileName);
        var source = this.files[f];
        if (typeof (source) === 'string') {
            return source;
        }
        return this.baseHost.readFile(fileName);
    };
    return CompilerHostForMemoryFiles;
}());
function createProgramFromMemory(files, compilerOptions, host, oldProgram) {
    var newHost = new CompilerHostForMemoryFiles(files, host);
    return ts.createProgram(Object.keys(files), compilerOptions, newHost, oldProgram);
}
exports.default = createProgramFromMemory;
