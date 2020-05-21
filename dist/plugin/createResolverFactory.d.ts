import * as ts from 'typescript';
import node = require('enhanced-resolve/lib/node');
import Options from '../types/Options';
import PluginOptions from './PluginOptions';
export declare type ResolverFactory = (options: Options, compilerOptions: ts.CompilerOptions, host: ts.CompilerHost, resolutionCache: ts.ModuleResolutionCache) => ((moduleNames: string[], containingFile: string, reusedNames?: string[]) => (ts.ResolvedModule | undefined)[]);
export default function createResolverFactory(pluginOptions: PluginOptions, resolve: node.CreateResolverOptions): ResolverFactory;
