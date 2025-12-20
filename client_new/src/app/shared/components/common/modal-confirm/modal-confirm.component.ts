import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-modal-confirm',
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './modal-confirm.component.html',
  styles: ``,
})
export class ModalConfirmComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
