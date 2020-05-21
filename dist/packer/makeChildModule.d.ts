import * as ts from 'typescript';
import ExportDataMap from '../types/ExportDataMap';
import Options from '../types/Options';
export default function makeChildModule(options: Options, sourceFile: ts.SourceFile, sourceFiles: ReadonlyArray<ts.SourceFile>, baseModulePath: string, baseModuleName: string, host: ts.CompilerHost, compilerOptions: ts.CompilerOptions, resolutionCache: ts.ModuleResolutionCache, stripUnusedExports?: ExportDataMap | undefined): {
    name: string;
    module: ts.ModuleDeclaration;
} | null;
