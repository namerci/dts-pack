"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function resolveTsconfig(options) {
    var projectFile;
    if (!options.project) {
        projectFile = './tsconfig.json';
    }
    else {
        projectFile = options.project;
        if (fs.statSync(projectFile).isDirectory()) {
            projectFile = path.resolve(projectFile, 'tsconfig.json');
        }
    }
    return projectFile;
}
exports.default = resolveTsconfig;
