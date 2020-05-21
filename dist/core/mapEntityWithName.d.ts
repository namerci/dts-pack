import * as ts from 'typescript';
export default function mapEntityWithName<T>(mapCallback: (node: ts.Node, exportName: string, baseName: string | undefined, index: number) => T, node: ts.Node, source?: ts.SourceFile): T[];
