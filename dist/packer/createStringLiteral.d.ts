import * as ts from 'typescript';
declare module 'typescript' {
    interface StringLiteral {
        singleQuote?: boolean;
    }
}
export default function createStringLiteral(text: string, singleQuote?: boolean): ts.StringLiteral;
