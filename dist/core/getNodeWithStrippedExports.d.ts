import * as ts from 'typescript';
import ExportDataMap from '../types/ExportDataMap';
export default function getNodeWithStrippedExports<TNode extends ts.Node>(sourceFile: ts.SourceFile, resolvedFileName: string, node: TNode, stripUnusedExports: ExportDataMap): TNode | null;
