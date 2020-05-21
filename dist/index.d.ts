import * as ts from 'typescript';
import Options from './types/Options';
import DtsPackPlugin from './plugin/DtsPackPlugin';
/**
 * Executes packing for specified file data.
 * @param messageWriter the callback function for logging (used when options.list is true)
 * @param options options for packing
 * @param inputFiles input file data (each key is a file name and value is an entire content)
 *                   If no files are specified, uses source files in the TypeScript project..
 * @param checkInputs if true, executes the emit process of TypeScript
 * @return output files and warning messages
 * @throws string for error messages or Error object otherwise
 */
export declare function runWithFiles(messageWriter: (text: string) => void, options: Options, inputFiles?: {
    [fileName: string]: string;
}, checkInputs?: boolean, resolverFactory?: (options: Options, compilerOptions: ts.CompilerOptions, host: ts.CompilerHost, resolutionCache: ts.ModuleResolutionCache) => ((moduleNames: string[], containingFile: string, reusedNames?: string[]) => (ts.ResolvedModule | undefined)[])): {
    files: {
        [fileName: string]: string;
    };
    warnings: string;
};
/**
 * Executes packing for project files.
 * @param messageWriter the callback function for logging (used when options.list is true)
 * @param options options for packing
 * @return output files and warning messages
 * @throws string for error messages or Error object otherwise
 */
export declare function run(messageWriter: (text: string) => void, options: Options): {
    files: {
        [fileName: string]: string;
    };
    warnings: string;
};
export { DtsPackPlugin };
