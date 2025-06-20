import { NgClass, NgIf } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Tooltip } from 'bootstrap';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo/todo.service';

@Component({
  selector: 'app-todo-row',
  standalone: true,
  imports: [NgClass, NgIf, ReactiveFormsModule],
  templateUrl: './todo-row.component.html',
  styleUrl: './todo-row.component.css',
})
export class TodoRowComponent implements AfterViewChecked, AfterViewInit, OnDestroy {
  @Input() todo: Todo;

  disableCheckbox: boolean;
  disableCloseBtn: boolean;

  @Output() deleteTodo: EventEmitter<unknown>;

  isEditing: boolean;
  currentContent: string;

  editInputFormControl = new FormControl();

  @ViewChild('editInputRef') inputRef?: ElementRef;
  @ViewChild('todoRowRef', { static: false }) todoRowRef?: ElementRef;

  tooltipInstance: Tooltip | null = null;
  hasFocusedInput: boolean;

  clickCount: number;
  clickTimer!: ReturnType<typeof setTimeout>;
  readonly DOUBLE_CLICK_DELAY: 250;

  constructor(
    private todoService: TodoService,
    private router: Router,
  ) {
    this.todo = {
      id: 'id-default-xyz',
      content: 'content-default',
      createdAt: new Date(),
      done: false,
    };
    this.disableCheckbox = false;
    this.disableCloseBtn = false;

    this.deleteTodo = new EventEmitter();
    this.isEditing = false;
    this.currentContent = '';

    this.hasFocusedInput = false;

    this.clickCount = 0;
    this.DOUBLE_CLICK_DELAY = 250; // ms
  }

  onComplete() {
    this.disableCheckbox = true;
    this.disableCloseBtn = true;
    // Simulate server request/response time.
    setTimeout(() => {
      this.todoService.toggleCompletedTodo(this.todo.id);
      this.disableCheckbox = false;
      this.disableCloseBtn = false;
    }, 100);
  }

  performDeletion() {
    this.todoService.deleteOneTodo(this.todo.id);
    this.deleteTodo.emit();
  }

  onDelete() {
    this.disableCheckbox = true;
    this.disableCloseBtn = true;
    // Simulate server request/response time.
    setTimeout(() => {
      this.destroyTooltip();
      this.performDeletion();
      this.disableCheckbox = false;
      this.disableCloseBtn = false;
    }, 100);
  }

  onEnterEditMode() {
    clearTimeout(this.clickTimer);
    this.isEditing = true;
    this.clickCount = 0;

    const content = this.todo.content;
    this.currentContent = content;
    this.editInputFormControl.setValue(content);

    this.destroyTooltip();
  }

  onSave() {
    const newContent = this.editInputFormControl.value?.trim() ?? '';

    if (!newContent) this.performDeletion();
    else if (this.currentContent !== newContent) this.todoService.editContent(this.todo.id, newContent);

    if (this.todoRowRef?.nativeElement) this.createTooltip();

    this.isEditing = false;
    this.hasFocusedInput = false;
  }

  ngAfterViewChecked(): void {
    if (this.isEditing && !this.hasFocusedInput && this.inputRef) {
      this.inputRef.nativeElement.focus();
      this.hasFocusedInput = true;
    }
  }

  ngAfterViewInit(): void {
    this.createTooltip();
  }

  createTooltip() {
    if (this.todoRowRef?.nativeElement) this.tooltipInstance = new Tooltip(this.todoRowRef.nativeElement);
  }

  destroyTooltip() {
    if (this.tooltipInstance) {
      this.tooltipInstance.dispose();
      this.tooltipInstance = null;
    }
  }

  onClick() {
    this.clickCount++;

    if (this.clickCount === 1) {
      this.clickTimer = setTimeout(() => {
        const todoPagePath = '/todo';

        this.clickCount = 0;
        this.router.navigate([todoPagePath, this.todo.id]);
      }, this.DOUBLE_CLICK_DELAY);
    } else {
      clearTimeout(this.clickTimer);
      this.onEnterEditMode();
    }
  }

  ngOnDestroy(): void {
    this.destroyTooltip();
  }
}
