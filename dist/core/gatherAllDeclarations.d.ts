import * as ts from 'typescript';
export default function gatherAllDeclarations(inputFiles: {
    [fileName: string]: string;
} | undefined, tsProgram: ts.Program, projectFile: string, compilerOptions: ts.CompilerOptions, checkInputs?: boolean): {
    files: {
        [fileName: string]: string;
    };
    diagnostics: ReadonlyArray<ts.Diagnostic>;
    hasError: boolean;
};
