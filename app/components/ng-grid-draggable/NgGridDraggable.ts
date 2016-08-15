import {
    Directive,
    ElementRef,
    Input,
    HostListener
} from '@angular/core';
import {GridDragService} from '../../service/GridDragService';
import {NgGridItemConfig} from '../ng-grid-item/NgGridItemTypes';

@Directive({
    selector: '[ngGridDraggable]',
})
export class NgGridDraggable {
    @Input('ngGridDraggable') private content: NgGridItemConfig;

    constructor(private elementRef: ElementRef, private gridDragService: GridDragService) {
        this.elementRef.nativeElement.draggable = 'true';
    }

    @HostListener('dragstart')
    dragStart(): void {
        this.gridDragService.dragItemConf = this.content;
    }
}
