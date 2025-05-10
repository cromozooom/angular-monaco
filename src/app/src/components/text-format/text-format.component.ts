import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-text-format',
  standalone: true,
  templateUrl: './text-format.component.html',
  styles: [
    `
      .editor-container {
        width: 100%;
        height: 100%;
        border: 1px solid #ccc;
      }
    `,
  ],
})
export class TextFormatComponent implements OnInit {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  editor!: monaco.editor.IStandaloneCodeEditor;

  // Valid fields
  fieldsValidWIthData: any = [
    {
      name: 'wdxTotalAssets',
      type: 450,
      value: 'wdx Total Assets',
    },
    {
      name: 'DYNAMIC_servicetypes',
      type: 'string',
      value: 'Service types',
    },
    {
      name: 'wdxFinancialOtherLiabilitiesAmount',
      type: 'string',
      value: 'wdx Financial Other Liabilities Amount',
    },
    {
      name: 'wdxNetIncome',
      type: 'string',
      value: 'wdx Net Income',
    },
    {
      name: 'DYNAMIC_clientcategory',
      type: 'string',
      value: 'DYNAMIC client category',
    },
  ];
  fieldsValid: string[] = ['wdxTotalAssets', 'DYNAMIC_servicetypes'];

  // All fields
  fields: string[] = [
    'wdxTotalAssets',
    'wdxFinancialOtherLiabilitiesAmount',
    'wdxNetIncome',
    'DYNAMIC_servicetypes',
    'DYNAMIC_clientcategory',
  ];

  private currentDecorations: string[] = []; // Track current decorations

  ngOnInit(): void {
    this.registerCustomLanguage();
    this.registerHoverProvider();
    this.initializeEditor();
  }

  registerCustomLanguage(): void {
    monaco.languages.register({ id: 'customLanguage' });

    monaco.languages.setMonarchTokensProvider('customLanguage', {
      tokenizer: {
        root: [
          [
            /(GET\(')([^']*)('\))/,
            ['custom-get', 'custom-variable', 'custom-get'],
          ],
        ],
      },
    });

    monaco.editor.defineTheme('customTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'custom-get', foreground: '000000' },
        { token: 'custom-variable', foreground: '000000', fontStyle: 'bold' },
      ],
      colors: {},
    });
  }

  registerHoverProvider(): void {
    monaco.languages.registerHoverProvider('customLanguage', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) {
          return null;
        }

        const lineContent = model.getLineContent(position.lineNumber);
        const regex = /GET\('([^']+)'\)/g;
        let match;
        let matchedVariable = null;

        // Find all matches of GET('...') in the line
        while ((match = regex.exec(lineContent)) !== null) {
          const variable = match[1]; // Extract the variable inside GET('...')
          const startIndex = match.index + 5; // Start index of the variable
          const endIndex = startIndex + variable.length; // End index of the variable

          // Check if the hovered word matches the variable
          if (
            position.column >= startIndex + 1 &&
            position.column <= endIndex + 1 &&
            word.word === variable
          ) {
            matchedVariable = variable;
            break;
          }
        }

        if (matchedVariable) {
          // Find the corresponding field data
          const fieldData = this.fieldsValidWIthData.find(
            (field: any) => field.name === matchedVariable
          );

          if (fieldData) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**Variable:** ${fieldData.name}` },
                { value: `**Type:** ${fieldData.type}` },
                { value: `**Description:** ${fieldData.value}` },
              ],
            };
          } else {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [{ value: `no data available` }],
            };
          }
        }

        return null;
      },
    });
  }

  _registerHoverProvider(): void {
    monaco.languages.registerHoverProvider('customLanguage', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) {
          return null;
        }

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Check if the hovered word is inside GET('...')
        const match = textUntilPosition.match(/GET\('([^']*)/);
        if (match && match[1] === word.word) {
          // Find the corresponding field data
          const fieldData = this.fieldsValidWIthData.find(
            (field: any) => field.name === word.word
          );

          if (fieldData) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**Variable:** ${fieldData.name}` },
                { value: `**Type:** ${fieldData.type}` },
                { value: `**Description:** ${fieldData.value}` },
              ],
            };
          } else {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [{ value: `no data available` }],
            };
          }
        }

        return null;
      },
    });
  }

  initializeEditor(): void {
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: ` ( GET('DYNAMIC_clientcategory')!=null&& ( GET('DYNAMIC_clientcategory').indexOf('Trust')>-1||GET('DYNAMIC_clientcategory').indexOf('Corporation')>-1 ) ) && ( GET('DYNAMIC_servicetypes')==null||GET('DYNAMIC_servicetypes').indexOf('Financial Planning Transactional (Insurance)')==-1 ) `,
      language: 'customLanguage',
      theme: 'customTheme',
      wordWrap: 'on',
      minimap: {
        enabled: false, // Disable the minimap
      },
    });

    this.editor.onDidChangeModelContent(() => {
      const code = this.editor.getValue();
      this.highlightVariables(code);
    });

    this.highlightVariables(this.editor.getValue());
  }

  highlightVariables(code: string): void {
    const regex = /GET\('([^']+)'\)/g;
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    let match;

    while ((match = regex.exec(code)) !== null) {
      const variable = match[1]; // Extract the variable inside GET('...')
      const startIndex = match.index + 5; // Start index of the variable
      const endIndex = startIndex + variable.length; // End index of the variable

      const startPosition = this.editor.getModel()?.getPositionAt(startIndex);
      const endPosition = this.editor.getModel()?.getPositionAt(endIndex);

      if (startPosition && endPosition) {
        decorations.push({
          range: new monaco.Range(
            startPosition.lineNumber,
            startPosition.column,
            endPosition.lineNumber,
            endPosition.column
          ),
          options: {
            inlineClassName: this.fieldsValid.includes(variable)
              ? 'text-bg-success' // Apply the .valid class if the variable is valid
              : 'text-bg-info', // Apply the .mtkb class otherwise
          },
        });
      }
    }

    // Update decorations only if they have changed
    this.currentDecorations = this.editor.deltaDecorations(
      this.currentDecorations,
      decorations
    );
  }
}
