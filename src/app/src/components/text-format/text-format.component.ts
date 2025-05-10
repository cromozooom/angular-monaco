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
    this.registerCompletionProvider();
    this.initializeEditor();
  }

  ngAfterViewInit(): void {
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

  registerCompletionProvider(): void {
    monaco.languages.registerCompletionItemProvider('customLanguage', {
      triggerCharacters: ["'"], // Trigger suggestions when typing a single quote
      provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const regex = /GET\('([^']*)$/; // Match GET('...') up to the cursor position
        const match = lineContent.match(regex);

        if (match) {
          // Generate suggestions from fieldsValidWIthData
          const suggestions = this.fieldsValidWIthData.map((field: any) => ({
            label: field.name,
            kind: monaco.languages.CompletionItemKind.Variable, // Suggestion type
            insertText: field.name, // Text to insert
            detail: field.value, // Additional info about the field
          }));

          return { suggestions };
        }

        return { suggestions: [] }; // No suggestions if not inside GET('')
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
            inlineClassName: this.fieldsValidWIthData.some(
              (field: any) => field.name === variable
            )
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
