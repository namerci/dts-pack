import * as ts from 'typescript';
export default function resolveModule(host: ts.CompilerHost, options: ts.CompilerOptions, resolutionCache: ts.ModuleResolutionCache, moduleName: string, baseFile: string): ts.ResolvedModule | null;
