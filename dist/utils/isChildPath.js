"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
function isChildPath(basePath, targetPath) {
    var p = path.relative(basePath, targetPath).split(path.sep);
    return p.indexOf('..') < 0;
}
exports.default = isChildPath;
