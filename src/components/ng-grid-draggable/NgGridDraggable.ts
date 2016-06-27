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

    constructor(private el:ElementRef, private gridDragService:GridDragService) {
        this.el.nativeElement.draggable = "true";
    }

    private dragStart(e: any):void {
        this.gridDragService.dragItemConf = this.content;
    }
}
