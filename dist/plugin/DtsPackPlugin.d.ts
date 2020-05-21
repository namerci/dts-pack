import * as webpack from 'webpack';
import PluginOptions from './PluginOptions';
declare module 'webpack' {
    interface Compiler {
        hooks?: {
            [eventName: string]: {
                tap(name: string, fn: Function): void;
                tap(options: object, fn: Function): void;
                tapAsync(name: string, fn: Function): void;
                tapAsync(options: object, fn: Function): void;
            };
        };
        context?: string;
        outputPath?: string;
    }
}
export default class DtsPackPlugin {
    private options;
    constructor(options?: PluginOptions);
    apply(compiler: webpack.Compiler): void;
    private messageWriter(text);
}
