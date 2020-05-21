#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var fs = require("fs");
var path = require("path");
var yargs = require("yargs");
var thisName = 'dts-pack';
var version_1 = require("./core/version");
////////////////////////////////////////////////////////////////////////////////
function mkdirp(dir) {
    if (fs.existsSync(dir)) {
        return;
    }
    var p = path.dirname(dir);
    if (!fs.existsSync(p)) {
        mkdirp(p);
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}
////////////////////////////////////////////////////////////////////////////////
function main() {
    try {
        var argv = yargs
            .usage("Usage:\n  " + thisName + " --entry <entry-name> --module <module-name> [<options...>]\n  " + thisName + " --list [<options...>]")
            .option('project', {
            alias: 'p',
            default: './tsconfig.json',
            description: 'The project file or directory',
            type: 'string'
        })
            .option('entry', {
            alias: 'e',
            description: 'The entry module name in the project',
            type: 'string'
        })
            .option('moduleName', {
            alias: 'm',
            description: 'The output module name',
            type: 'string'
        })
            .option('export', {
            alias: 'x',
            description: 'The export entity name in the entry module name',
            type: 'string'
        })
            .option('rootName', {
            alias: 'r',
            type: 'string',
            description: 'The root variable name'
        })
            .option('outDir', {
            alias: 'o',
            type: 'string',
            default: './',
            description: 'The output directory name (not file name)'
        })
            .option('style', {
            alias: 's',
            type: 'string',
            choices: ['module', 'namespace'],
            default: 'module',
            description: 'The declaration style'
        })
            .option('defaultName', {
            alias: 'd',
            type: 'string',
            default: '_default',
            description: 'The \'default\' name for namespace-style'
        })
            .option('importBindingName', {
            type: 'string',
            default: '__module',
            description: 'The identifier for binding modules with \'import\''
        })
            .option('stripUnusedExports', {
            type: 'boolean',
            description: 'The flag whether exported entities are stripped when not used'
        })
            .option('forceDefineGlobal', {
            type: 'boolean',
            description: 'The flag whether to define global export variable forcely'
        })
            .option('headerText', {
            alias: ['header', 'H'],
            type: 'string',
            description: 'Header text data for output files'
        })
            .option('footerText', {
            alias: ['footer', 'F'],
            type: 'string',
            description: 'Footer text data for output files'
        })
            .option('isHeaderFooterRawText', {
            alias: ['raw', 'R'],
            type: 'boolean',
            description: 'If set, headerText and footerText are emitted without comment block'
        })
            .option('list', {
            type: 'boolean',
            description: 'If specified, outputs all imports and exports and exit without emitting files.'
        })
            .version(false)
            .option('version', {
            alias: 'V',
            type: 'boolean',
            description: 'Show version number'
        })
            .option('help', {
            alias: ['h', '?'],
            type: 'boolean',
            description: 'Show help'
        })
            .strict()
            .check(function (a) {
            var argv = a;
            if (argv.version) {
                return true;
            }
            if (!(argv.list || argv.entry || argv.moduleName)) {
                throw '--entry and --moduleName are missing';
            }
            if (!argv.list && !!argv.entry !== !!argv.moduleName) {
                throw 'both --entry and --moduleName must be specified';
            }
            if (argv.defaultName === 'default') {
                throw '--defaultName cannot be \'default\'';
            }
            return true;
        })
            .fail(function (msg, err, yargs) {
            if (err) {
                if (typeof err !== 'string') {
                    throw err;
                }
                msg = err;
            }
            msg = yargs.help().toString() + msg;
            throw msg;
        })
            .argv;
        if (argv.version) {
            console.log(thisName + " version " + version_1.default);
            return 0;
        }
        var outputs_1 = [];
        var writer = function (text) { outputs_1.push(text + '\n'); };
        var r_1 = index_1.run(writer, argv);
        if (r_1.warnings) {
            console.log(r_1.warnings);
        }
        var fileNames = Object.keys(r_1.files);
        fileNames.forEach(function (file) {
            var dirName = path.dirname(file);
            mkdirp(dirName);
            fs.writeFileSync(file, r_1.files[file], 'utf8');
        });
        if (outputs_1.length > 0) {
            console.log(outputs_1.join(''));
        }
    }
    catch (s) {
        if (s instanceof Error) {
            console.error(thisName + ": ERROR:", s);
        }
        else {
            if (typeof s !== 'string') {
                s = s.toString();
            }
            if (s) {
                console.error(s);
            }
        }
        return 1;
    }
    return 0;
}
process.exit(main());
