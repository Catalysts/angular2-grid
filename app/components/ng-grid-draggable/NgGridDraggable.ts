import {
    Directive,
    ElementRef, Input,
} from '@angular/core';
import {GridDragService} from "../../service/GridDragService";

@Directive({
    selector: '[ngGridDraggable]',
    inputs: ['content: ngGridDraggable'],
    host: {
        '(dragstart)': 'dragStart($event)',
    },
})
export class NgGridDraggable {
    private content:any;

    constructor(private elementRef:ElementRef, private gridDragService:GridDragService) {
        this.elementRef.nativeElement.draggable = "true";
    }

    private dragStart(e: any):void {
        this.gridDragService.dragItemConf = this.content;
    }
}
