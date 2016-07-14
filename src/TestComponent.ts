/**
 * Created by tudorgergely on 5/24/16.
 */
import {
    Component, Input, ChangeDetectorRef, OnInit,
} from '@angular/core';
import {GridDragService} from "./service/GridDragService";

@Component({
    selector: 'testComponent',
    template: `
        <div style="width: 100px; height: 100px; background: red;">Hello, {{name}}
            <button (mousedown)="clickButton($event)">Test</button>
        </div>
    `,
})
export class TestComponent implements OnInit {
    name:string = 'aa';
    id:string;

    constructor(private changeDetectorRef:ChangeDetectorRef,
    private gridDragService:GridDragService) {
    }

    ngOnInit() {
        this.changeDetectorRef.detectChanges();
    }

    clickButton(e) {
        this.gridDragService.removeItemById(this.id);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
}