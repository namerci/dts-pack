import * as ts from 'typescript';
import EditorConfig from '../types/EditorConfig';
import Options from '../types/Options';
export default function outputFiles(options: Options, econf: EditorConfig, projectFile: string, sourceFiles: ReadonlyArray<ts.SourceFile>, host: ts.CompilerHost, compilerOptions: ts.CompilerOptions, resolutionCache: ts.ModuleResolutionCache, program: ts.Program): {
    files: {
        [fileName: string]: string;
    };
    warnings: string;
};
