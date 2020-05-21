import * as ts from 'typescript';
import ExportDataMap from '../types/ExportDataMap';
import ImportsAndExports from '../types/ImportsAndExports';
export default function pickupUnusedExports(entryFile: string, entryExport: string | undefined, allData: {
    [fileName: string]: ImportsAndExports;
}, host: ts.CompilerHost, compilerOptions: ts.CompilerOptions, resolutionCache: ts.ModuleResolutionCache): ExportDataMap;
