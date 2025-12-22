import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import flatpickr from 'flatpickr';
import { LabelComponent } from '../label/label.component';
import 'flatpickr/dist/flatpickr.css';

@Component({
  selector: 'app-date-picker',
  imports: [CommonModule, LabelComponent],
  templateUrl: './date-picker.component.html',
  styles: ``,
})
export class DatePickerComponent {
  @Input() id!: string;
  @Input() mode: 'single' | 'multiple' | 'range' | 'time' = 'single';
  @Input() defaultDate?: string | Date | string[] | Date[];
  @Input() label?: string;
  @Input() placeholder?: string;
  @Output() dateChange = new EventEmitter<any>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      mode: this.mode,
      static: true,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d',
      defaultDate: this.defaultDate,
      onChange: (selectedDates, dateStr, instance) => {
        this.dateChange.emit({ selectedDates, dateStr, instance });
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultDate']) {
      // Check if the 'defaultDate' property specifically changed
      const current = changes['defaultDate'].currentValue;
      const previous = changes['defaultDate'].previousValue;
      console.log(`Input 'defaultDate' changed from "${previous}" to "${current}"`);
      // Add your custom logic here
      this.flatpickrInstance?.setDate(current, false);
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
