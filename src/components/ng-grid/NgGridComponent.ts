import {
    Component,
    OnInit,
    OnChanges,
    Input,
    ViewChild, ComponentFactory, ElementRef, ViewChildren, QueryList,
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
import {GridPositionService} from "../../service/GridPositionService";

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
        <div [ngGrid]="config">
            <div [ngGridItem]="item"
                 *ngFor="let item of items; let i = index"
                 id="gridItem_{{i}}">
            </div>
        </div>
    `,
    host: {
        '(mousemove)': 'mouseMove$.next(toObserverEvent($event))',
        '(mousedown)': 'mouseDown($event)',
        '(mouseup)': 'mouseUp($event)',
        '(dragover)': 'dragOver($event)',
        '(drop)': 'drop($event)',
    },
})
export class NgGridComponent implements OnInit {
    @ViewChild(NgGrid)
    public ngGrid:NgGrid;

    @ViewChildren(NgGridItem)
    public gridItems: QueryList<NgGridItem>;

    @Input()
    public items:NgGridItemConfig[] = [];

    public mouseMove$:Subject<any> = new Subject();
    public newItemAdd$:Subject<any> = new Subject();

    constructor(private gridDragService:GridDragService,
                private gridPositionService:GridPositionService) {
    }

    ngOnInit() {
        const {inside, outside, release} = this.gridDragService.registerGrid(this);
        inside.subscribe(v => this.itemDraggedInside(v));
        outside.subscribe(v => this.itemDragOutside(v));
        release.subscribe(v => this.itemReleased(v));

        setTimeout(() => this.injectItems(), 100);
    }

    public itemDraggedInside(v) {
        if (this.gridDragService.draggedItem) {
            const {item, event} = v.itemDragged;
            const conf = this.itemConfigFromEvent(item.config, event.event);
            const dims = item.getSize();
            this.ngGrid._placeholderRef.instance.setGridPosition(conf.col, conf.row);
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.itemDragged.item)
                && !this.hasCollisions(conf, v.itemDragged.item.config)) {
                this.ngGrid._placeholderRef.instance.makeValid();
            } else {
                this.ngGrid._placeholderRef.instance.makeInvalid();
            }
            this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
        }
    }

    public itemDragOutside(v) {
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    public itemReleased(v) {
        const conf = this.itemConfigFromEvent(v.release.item.config, v.move.event);

        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.release.item)
            && !this.hasCollisions(conf, v.release.item.config)) {
            this.newItemAdd$.next({
                grid: this,
                newConfig: conf,
                oldConfig:v.release.item.config
            });
        }
        v.release.item.stopMoving();
        this.gridDragService.draggedItem = undefined;
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
        this.gridDragService.refreshAll();
    }

    private itemConfigFromEvent(config:NgGridItemConfig, event:MouseEvent):NgGridItemConfig {
        const {col, row} = this.ngGrid.getGridPositionOfEvent(event, this.gridDragService.posOffset);
        return Object.assign({}, config, {col, row});
    }

    private hasCollisions(itemConf:NgGridItemConfig, initialConf:NgGridItemConfig):boolean {
        return this.items
            .filter(c => !(c.col == initialConf.col && c.row == initialConf.row))
            .some((conf:NgGridItemConfig) => intersect(
                toRectangle(conf), toRectangle(itemConf)
            ));

        function intersect(r1, r2) {
            return !(r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
        }

        function toRectangle(conf:NgGridItemConfig) {
            return {
                left: conf.col,
                top: conf.row,
                right: conf.col + conf.sizex - 1,
                bottom: conf.row + conf.sizey - 1
            };
        }
    }

    private dragOver(e) {
        const item = this.gridDragService.dragItemConf;
        if (!item) return;
        const dims = {
            x: item.sizex,
            y: item.sizey
        };
        const conf = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
        this.ngGrid._placeholderRef.instance.setGridPosition(conf.col, conf.row);
        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, item)
            && !this.hasCollisions(conf, item)) {
            this.ngGrid._placeholderRef.instance.makeValid();
        } else {
            this.ngGrid._placeholderRef.instance.makeInvalid();
        }
        this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
        e.preventDefault();
    }

    private drop(e) {
        const content = this.gridDragService.dragItemConf;
        this.gridDragService.dragItemConf = null;
        if (content) {
            const conf = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, content)
                && !this.hasCollisions(conf, content)) {
                this.addItem(Object.assign(content, conf));
            }
        }
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    public removeItem(item:NgGridItemConfig) {
        let removed = false;
        this.items = this.items.filter(i => {
            if (i.col == item.col && i.row == item.row && !removed) {
                removed = true;
                return false;
            } else {
                return true;
            }
        });
        // this.injectItems(this.items);
    }

    public addItem(item:NgGridItemConfig) {
        this.items = this.items.concat([item]);
        setTimeout(() => {
            const element = this.gridItems.last._ngEl.nativeElement;
            this.ngGrid.injectItem(item.component.type, element, item.component.data);
        }, 20);
    }

    private mouseDown(e) {
        const i = this.ngGrid.getItem(e);
        if (i && i.canDrag(e)) {
            this.gridDragService.dragStart(i, this, e);
        }
    }

    private mouseUp(e:MouseEvent) {
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    private toObserverEvent(event) {
        return {
            grid: this,
            event,
        };
    }

    private injectItems():void {
        if (this.gridItems) {
            this.gridItems.forEach((item, index) => this.ngGrid.injectItem(item.config.component.type, item._ngEl.nativeElement, item.config.component.data));
        }
    }
}