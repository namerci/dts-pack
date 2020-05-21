import * as ts from 'typescript';
import ExportDataMap from '../types/ExportDataMap';
import ExternalImportData from '../types/ExternalImportData';
import GlobalDeclarationData from '../types/GlobalDeclarationData';
import ImportsAndExports from '../types/ImportsAndExports';
import Options from '../types/Options';
export default function rebuildAST(options: Options, sourceFile: ts.SourceFile, sourceFiles: ReadonlyArray<ts.SourceFile>, basePath: string, allData: {
    sourceFile: ts.SourceFile;
    data: ImportsAndExports;
}[], externalImportData: ExternalImportData, outGlobals: GlobalDeclarationData[], host: ts.CompilerHost, program: ts.Program, compilerOptions: ts.CompilerOptions, resolutionCache: ts.ModuleResolutionCache, stripUnusedExports?: ExportDataMap | undefined): ts.ModuleDeclaration | null;
