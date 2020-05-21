"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var editorconfig = require("editorconfig");
var createProgramFromMemory_1 = require("./core/createProgramFromMemory");
var gatherAllDeclarations_1 = require("./core/gatherAllDeclarations");
var getFormatDiagnosticHost_1 = require("./core/getFormatDiagnosticHost");
var isEqualPath_1 = require("./utils/isEqualPath");
var resolveTsconfig_1 = require("./utils/resolveTsconfig");
var outputFiles_1 = require("./packer/outputFiles");
var printImportsAndExports_1 = require("./packer/printImportsAndExports");
var DtsPackPlugin_1 = require("./plugin/DtsPackPlugin");
exports.DtsPackPlugin = DtsPackPlugin_1.default;
////////////////////////////////////////////////////////////////////////////////
/**
 * Executes packing for specified file data.
 * @param messageWriter the callback function for logging (used when options.list is true)
 * @param options options for packing
 * @param inputFiles input file data (each key is a file name and value is an entire content)
 *                   If no files are specified, uses source files in the TypeScript project..
 * @param checkInputs if true, executes the emit process of TypeScript
 * @return output files and warning messages
 * @throws string for error messages or Error object otherwise
 */
function runWithFiles(messageWriter, options, inputFiles, checkInputs, resolverFactory) {
    var projectFile = resolveTsconfig_1.default(options);
    var conf = ts.readConfigFile(projectFile, function (path) { return fs.readFileSync(path, 'utf8'); });
    if (conf.error) {
        throw ts.formatDiagnostic(conf.error, getFormatDiagnosticHost_1.default());
    }
    var r = ts.parseJsonConfigFileContent(conf.config, ts.sys, path.dirname(projectFile));
    if (r.errors && r.errors.length) {
        throw ts.formatDiagnostics(r.errors, getFormatDiagnosticHost_1.default());
    }
    var compilerOptions = r.options;
    if (options.compilerOptions) {
        compilerOptions = Object.assign({}, compilerOptions, options.compilerOptions);
    }
    compilerOptions.declaration = true;
    var host = ts.createCompilerHost(compilerOptions);
    var resolutionCache = ts.createModuleResolutionCache(process.cwd(), function (file) { return host.getCanonicalFileName(file); });
    if (resolverFactory) {
        host.resolveModuleNames = resolverFactory(options, compilerOptions, host, resolutionCache);
    }
    var program = ts.createProgram(inputFiles && Object.keys(inputFiles).length > 0 ? [] : r.fileNames, compilerOptions, host);
    var decls = gatherAllDeclarations_1.default(inputFiles, program, projectFile, compilerOptions, checkInputs);
    if (decls.hasError) {
        throw ts.formatDiagnostics(decls.diagnostics, getFormatDiagnosticHost_1.default());
    }
    var newProgram = createProgramFromMemory_1.default(decls.files, compilerOptions, host, program);
    var files = (function () {
        var baseFiles = Object.keys(decls.files);
        return newProgram.getSourceFiles().filter(function (file) {
            return baseFiles.some(function (f) { return isEqualPath_1.default(file.fileName, f); });
        });
    })();
    var warnings = '';
    if (decls.diagnostics && decls.diagnostics.length) {
        warnings = ts.formatDiagnostics(decls.diagnostics, getFormatDiagnosticHost_1.default());
    }
    var econf;
    try {
        var theEditorConfig = editorconfig.parseSync(projectFile);
        if (!theEditorConfig) {
            throw new Error();
        }
        var lineBreak = void 0;
        switch (theEditorConfig.end_of_line) {
            case 'lf':
                lineBreak = '\n';
                break;
            case 'crlf':
            // fall-through
            default:
                lineBreak = '\r\n';
                break;
        }
        econf = {
            lineBreak: lineBreak
        };
    }
    catch (_a) {
        econf = {
            lineBreak: '\r\n'
        };
    }
    if (options.list) {
        printImportsAndExports_1.default(messageWriter, options, econf, projectFile, files, host, compilerOptions, resolutionCache, newProgram);
        return {
            files: {},
            warnings: warnings
        };
    }
    else {
        var x = outputFiles_1.default(options, econf, projectFile, files, host, compilerOptions, resolutionCache, newProgram);
        return {
            files: x.files,
            warnings: warnings + x.warnings
        };
    }
}
exports.runWithFiles = runWithFiles;
/**
 * Executes packing for project files.
 * @param messageWriter the callback function for logging (used when options.list is true)
 * @param options options for packing
 * @return output files and warning messages
 * @throws string for error messages or Error object otherwise
 */
function run(messageWriter, options) {
    return runWithFiles(messageWriter, options, {});
}
exports.run = run;
