import {
    Directive,
    ElementRef,
} from '@angular/core';

@Directive({
    selector: '[ngGridDraggable]',
    inputs: ['content: ngGridDraggable'],
    host: {
        '(dragstart)': 'dragStarted($event)',
    },
})
export class NgGridDraggable {
    private content: any;

    constructor(el:ElementRef) {
        el.nativeElement.draggable = true;
    }

    private dragStarted(e:any) {
        e.dataTransfer.setData('content', this.content);
    }
}
