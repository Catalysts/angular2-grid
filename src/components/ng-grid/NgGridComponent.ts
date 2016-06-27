import {
    Component,
    OnInit,
    OnChanges,
    Input,
    ViewChild, ComponentFactory,
} from '@angular/core';

import {
    NgGridItem,
} from '../ng-grid-item/NgGridItem';

import {GridDragService} from '../../service/GridDragService';

import {
    NgGrid,
} from './NgGrid';
import {Subject} from "rxjs/Rx";
import {NgGridItemConfig} from "../ng-grid-item/NgGridItemConfig";

@Component({
    selector: 'ngGrid',
    inputs: [
        'items: items',
        'config: config',
    ],
    directives: [
        NgGridItem,
        NgGrid,
    ],
    template: `
        <div [ngGrid]="config" style="min-height: 100px; min-width: 100px;">
            <div [ngGridItem]="item"
                 *ngFor="let item of items; let i = index"
                 id="gridItem_{{i}}">
            </div>
        </div>
    `,
    host: {
        '(mousemove)': 'mouseMove$.next(toObserverEvent($event))',
        '(mousedown)': 'mouseDown($event)',
        '(dragover)': 'dragOver($event)',
        '(drop)': 'drop($event)',
    },
})
export class NgGridComponent implements OnInit, OnChanges {
    @ViewChild(NgGrid)
    private ngGrid:NgGrid;

    @Input()
    private items:any[];

    public mouseMove$:Subject<any> = new Subject();
    public dragOver$:Subject<any> = new Subject();
    public newItemAdd$:Subject<any> = new Subject();

    constructor(private gridDragService:GridDragService) {
    }

    ngOnInit() {
        const dragSubscriptors = this.gridDragService.addGrid(this);
        dragSubscriptors.inside.subscribe(v => {
            if (this.gridDragService.draggedItem) {
                setTimeout(() => {
                    // console.log('inside', this.ngGrid._placeholderRef);
                    if (!this.ngGrid._placeholderRef) {
                        this.ngGrid._createPlaceholder(v.itemDragged.item);
                    } else {
                        const {left, top} = this.ngGrid._getMousePosition(v.itemDragged.event.event);
                        const i = this.ngGrid._calculateGridPosition(left, top);
                        this.ngGrid._placeholderRef.instance.setGridPosition(i.col, i.row, v.itemDragged.item);
                    }
                });
            }
        });
        dragSubscriptors.outside.subscribe(v =>null /*console.log('outside', this.items.length)*/);
        dragSubscriptors.release.subscribe(v => {
            const {left, top} = this.ngGrid._getMousePosition(v.move.event);
            const i = this.ngGrid._calculateGridPosition(left, top);
            let conf = Object.assign({}, v.release.item.config);
            conf.col = i.col;
            conf.row = i.row;
            this.addItem(conf);
            v.release.item.stopMoving();
            this.ngGrid.refreshGrid();
            this.ngGrid._placeholderRef.destroy();
            this.ngGrid._placeholderRef = undefined;
            this.newItemAdd$.next({
                grid: this,
                item: v.release.item,
            });
        });
    }

    ngOnChanges(changes:any) {
        if (changes.items) {
            this.injectItems(this.items);
        }
    }

    private dragOver(e) {
        e.preventDefault();
    }

    private drop(e) {
        const content = this.gridDragService.dragItemConf;
        this.gridDragService.dragItemConf = null;
        if (content) {
            this.addItem(content);
        }
    }

    public removeItem(item:NgGridItemConfig) {
        setTimeout(() => {
            let removed = false;
            this.items = this.items.filter(i => {
                if (i.col == item.col && i.row == item.row && !removed) {
                    removed = true;
                    return false;
                } else {
                    return true;
                }
            });
            this.injectItems(this.items);
        });
    }

    public addItem(item:NgGridItemConfig) {
        setTimeout(() => {
            this.items = this.items.concat([item]);
            this.injectItems(this.items);
        });
    }

    private mouseDown(e) {
        const i = this.ngGrid._getItemFromPosition(this.ngGrid._getMousePosition(e));
        if (i && i.canDrag(e)) {
            this.gridDragService.dragStart(i, this, e);
        }
        // return false;
    }

    private toObserverEvent(event) {
        return {
            grid: this,
            event,
        };
    }

    private injectItems(items:any[]):void {
        setTimeout(() => {
            items.forEach((item, index) => this.ngGrid.injectItem(item.component, `gridItem_${index}`));
        });
    }
}