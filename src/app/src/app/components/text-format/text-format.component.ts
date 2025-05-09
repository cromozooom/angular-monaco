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
  fieldsValid: string[] = ['wdxTotalAssets', 'DYNAMIC_servicetypes'];

  // All fields
  fields: string[] = [
    'wdxTotalAssets',
    'wdxFinancialsOtherLiabilitiesAmount',
    'wdxNetIncome',
    'DYNAMIC_servicetypes',
    'DYNAMIC_clientcategory',
  ];

  ngOnInit(): void {
    this.registerCustomLanguage();
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

    // Apply the decorations to the editor
    this.editor.deltaDecorations([], decorations);
  }
}
