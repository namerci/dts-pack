"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var MyFormatDiagnosticsHost = /** @class */ (function () {
    function MyFormatDiagnosticsHost() {
    }
    MyFormatDiagnosticsHost.prototype.getCurrentDirectory = function () {
        return __dirname;
    };
    MyFormatDiagnosticsHost.prototype.getCanonicalFileName = function (fileName) {
        return path.resolve(__dirname, fileName);
    };
    MyFormatDiagnosticsHost.prototype.getNewLine = function () {
        return '\n';
    };
    return MyFormatDiagnosticsHost;
}());
var host = new MyFormatDiagnosticsHost();
function getFormatDiagnosticHost() {
    return host;
}
exports.default = getFormatDiagnosticHost;
