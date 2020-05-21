"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
function isEqualPath(path1, path2) {
    return path.normalize(path1) === path.normalize(path2);
}
exports.default = isEqualPath;
