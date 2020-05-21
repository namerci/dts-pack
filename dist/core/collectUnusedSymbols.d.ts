import * as ts from 'typescript';
import ExportData from '../types/ExportData';
export default function collectUnusedSymbols(sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker, unusedExports?: ExportData[]): string[];
