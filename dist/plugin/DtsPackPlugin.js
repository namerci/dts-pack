"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var index_1 = require("../index");
function searchTsconfigFile(entryFile, projectFile) {
    if (path.isAbsolute(projectFile)) {
        return projectFile;
    }
    var baseDir = path.resolve(path.dirname(entryFile));
    var checkPath = path.join(baseDir, projectFile);
    if (fs.existsSync(checkPath)) {
        return checkPath;
    }
    // if thep ath of projectFile is a relative path, then
    // finish checking (don't check parent directories)
    if (/^\.\.?[\\\/]/.test(projectFile)) {
        return void (0);
    }
    // check parent directories
    while (true) {
        var parentDir = path.dirname(baseDir);
        if (parentDir === baseDir) {
            break;
        }
        baseDir = parentDir;
        checkPath = path.join(baseDir, projectFile);
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return void (0);
}
function getWebpackOutputPath(compiler) {
    var conf = compiler.options || {};
    return compiler.outputPath || (conf.output && conf.output.path);
}
function computeOptions(options, compiler) {
    var conf = compiler.options || {};
    return (function () {
        if (options.entry) {
            return Promise.resolve(options.entry);
        }
        var e = conf.entry;
        if (typeof (e) === 'function') {
            // e: webpack.EntryFunc (since webpack 3)
            var func = e;
            var p = func();
            if (p instanceof Promise) {
                return p;
            }
            return Promise.resolve(p);
        }
        return Promise.resolve(e);
    })().then(function (v) {
        // compute entry and moduleName
        var moduleName = options.moduleName;
        if (!(v instanceof Array) && typeof (v) === 'object') {
            // v: webpack.Entry
            var keys = Object.keys(v);
            if (keys.length === 1) {
                // 'entry: { <moduleName>: <entry-point> }'
                if (!moduleName) {
                    moduleName = keys[0];
                }
                v = v[keys[0]];
            }
            else if (moduleName && v[moduleName]) {
                v = v[moduleName];
            }
            else {
                throw new Error("DtsPackPlugin: Multiple entry point is not allowed. Please specify 'entry' explicitly to the plugin option.");
            }
        }
        if (v instanceof Array) {
            // use last one (webpack exports only the last item)
            v = v.pop();
        }
        if (typeof (v) === 'string') {
            // fail if moduleName is not specified or detected
            if (!moduleName) {
                throw new Error("DtsPackPlugin: Cannot determine module name; please specify 'moduleName' to the plugin option.");
            }
            // entry name may be relative path
            var entry = path.resolve(v);
            // compute outDir from 'compiler.outputPath' or 'output.path' (if not specified, './' will be used)
            var outDir = options.outDir || getWebpackOutputPath(compiler) || './';
            // compute rootName from 'output.library' (if options.rootName is not specified)
            var rootName = options.rootName;
            if (!rootName && conf.output && conf.output.library) {
                var lib = conf.output.library;
                var libRoot = void 0;
                // output.library may be object containing 'root' field
                if (typeof lib === 'object' && !(lib instanceof Array)) {
                    libRoot = lib.root;
                }
                else {
                    libRoot = lib;
                }
                if (libRoot instanceof Array) {
                    // (since webpack 3)
                    rootName = libRoot.join('.');
                }
                else {
                    rootName = libRoot;
                }
                // compute forceDefineGlobal if not specified
                if (typeof options.forceDefineGlobal === 'undefined' &&
                    (!conf.output.libraryTarget || conf.output.libraryTarget === 'var')) {
                    options.forceDefineGlobal = true;
                }
            }
            // compute the path for tsconfig.json
            var project = searchTsconfigFile(entry, options.project || 'tsconfig.json');
            return Object.assign({}, options, {
                outDir: outDir,
                entry: entry,
                moduleName: moduleName,
                project: project,
                rootName: rootName
            });
        }
        throw new Error("DtsPackPlugin: Cannot determine entry name; please specify 'entry' to the plugin option.");
    });
}
var DtsPackPlugin = /** @class */ (function () {
    function DtsPackPlugin(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
    }
    DtsPackPlugin.prototype.apply = function (compiler) {
        var _this = this;
        var createResolverFactory = require('./createResolverFactory').default;
        var emitCallback = function (compilation, callback) {
            var webpackOutputPath = getWebpackOutputPath(compilation.compiler);
            computeOptions(_this.options, compiler)
                .then(function (opts) {
                var inputFiles = {};
                var fileCount = 0;
                Object.keys(compilation.assets).forEach(function (fileName) {
                    if (/\.d\.ts$/i.test(fileName)) {
                        var asset = compilation.assets[fileName];
                        var assetBasePath = webpackOutputPath || compilation.compiler.context || '';
                        inputFiles[path.resolve(assetBasePath, fileName)] = asset.source();
                        ++fileCount;
                        if (!_this.options.keepIndividualDeclarations) {
                            delete compilation.assets[fileName];
                        }
                    }
                });
                if (!opts.useProjectSources && fileCount === 0) {
                    // do nothing
                }
                else {
                    var r_1 = index_1.runWithFiles(_this.messageWriter.bind(_this), opts, opts.useProjectSources ? {} : inputFiles, false, createResolverFactory(_this.options, (compiler.options && compiler.options.resolve) || {}));
                    if (r_1.warnings && console.warn) {
                        console.warn(r_1.warnings);
                    }
                    var newFiles = Object.keys(r_1.files);
                    newFiles.forEach(function (file) {
                        var asset = (function (src) {
                            return {
                                source: function () { return src; },
                                size: function () { return src.length; }
                            };
                        })(r_1.files[file]);
                        compilation.assets[file] = asset;
                    });
                }
                callback();
            })
                .catch(function (e) {
                // callback must be called outside the 'catch' callback
                // since the 'callback' may throw the error 'e' and
                // the Promise will catch it
                setImmediate(function () {
                    callback(e);
                });
            });
        };
        if (compiler.hooks) {
            compiler.hooks.emit.tapAsync('dts-pack', emitCallback);
        }
        else {
            compiler.plugin('emit', emitCallback);
        }
    };
    DtsPackPlugin.prototype.messageWriter = function (text) {
        if (console.log) {
            console.log(text);
        }
    };
    return DtsPackPlugin;
}());
exports.default = DtsPackPlugin;
