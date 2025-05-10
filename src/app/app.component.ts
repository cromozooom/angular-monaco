import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TextFormatComponent } from './src/components/text-format/text-format.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TextFormatComponent],
  templateUrl: './app.component.html', // Link to the external HTML file
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
export class AppComponent {}
