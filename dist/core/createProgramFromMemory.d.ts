import * as ts from 'typescript';
export default function createProgramFromMemory(files: {
    [fileName: string]: string;
}, compilerOptions: ts.CompilerOptions, host: ts.CompilerHost, oldProgram?: ts.Program): ts.Program;
