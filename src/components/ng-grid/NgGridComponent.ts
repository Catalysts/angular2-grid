import {
    Component,
    OnInit,
    OnChanges,
    Input,
    ViewChild, ComponentFactory, ElementRef, ViewChildren, QueryList, OnDestroy, HostBinding,
    HostListener,
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
import {GridValidationService} from "../../service/GridPositionService";
import {NgGridConfig} from "./NgGridConfig";

@Component({
    selector: 'ngGrid',
    template: `
        <div [ngGrid]="config">
            <div [ngGridItem]="item"
                 *ngFor="let item of items">
            </div>
        </div>
    `,
    directives: [
        NgGridItem,
        NgGrid,
    ],
})
export class NgGridComponent implements OnInit, OnDestroy {
    @ViewChild(NgGrid)
    public ngGrid:NgGrid;

    @Input()
    private config:NgGridConfig;

    @Input()
    public items:NgGridItemConfig[] = [];

    public mouseMove$:Subject<any> = new Subject();
    public newItemAdd$:Subject<any> = new Subject();

    static GRID_POSITIONS_OFFSET = 1;

    constructor(private gridDragService:GridDragService,
                private gridPositionService:GridValidationService) {
    }

    ngOnInit() {
        const {inside, outside, release} = this.gridDragService.registerGrid(this);
        inside.subscribe(v => this.itemDraggedInside(v));
        outside.subscribe(v => this.itemDragOutside(v));
        release.subscribe(v => this.itemReleased(v));
    }

    ngOnDestroy():any {
        this.ngGrid._items.forEach(item => item.ngOnDestroy())
    }

    @HostListener('mousemove', ['$event'])
    private mouseMove(e) {
        this.mouseMove$.next(this.toObserverEvent(e));
    }

    public itemDraggedInside(v) {
        if (this.gridDragService.draggedItem) {
            const {item, event} = v.itemDragged;

            const conf = this.itemConfigFromEvent(item.config, event.event);
            const dims = item.getSize();
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.itemDragged.item, this.ngGrid._config)
                && !this.hasCollisions(conf, v.itemDragged.item.config)
                && !this.isOutsideGrid(conf, {
                    columns: this.ngGrid._config.maxCols,
                    rows: this.ngGrid._config.maxRows
                })) {
                this.ngGrid._placeholderRef.instance.makeValid();
            } else {
                this.ngGrid._placeholderRef.instance.makeInvalid();
            }
            this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
            this.ngGrid._placeholderRef.instance.setGridPosition(conf.col, conf.row);
        }
    }

    public itemDragOutside(v) {
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    public itemReleased(v) {
        const conf = this.itemConfigFromEvent(v.release.item.config, v.move.event);

        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.release.item, this.ngGrid._config)
            && !this.hasCollisions(conf, v.release.item.config)
            && !this.isOutsideGrid(conf, {columns: this.ngGrid._config.maxCols, rows: this.ngGrid._config.maxRows})) {
            this.newItemAdd$.next({
                grid: this,
                newConfig: conf,
                oldConfig: v.release.item.config,
                event: v.release.event
            });
        }
        v.release.item.stopMoving();
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
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

    private isOutsideGrid(item:NgGridItemConfig, gridSize:any):boolean {
        const {col, row} = item;
        const {sizex, sizey} = item;
        return (col + sizex - NgGridComponent.GRID_POSITIONS_OFFSET > gridSize.columns)
            || (row + sizey - NgGridComponent.GRID_POSITIONS_OFFSET > gridSize.rows);
    }

    @HostListener('dragover', ['$event'])
    private dragOver(e) {
        const item = this.gridDragService.dragItemConf;
        if (!item) return;
        const dims = {
            x: item.sizex,
            y: item.sizey
        };
        const conf:NgGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
        conf.sizex = dims.x;
        conf.sizey = dims.y;
        this.ngGrid._placeholderRef.instance.setGridPosition(conf.col, conf.row);
        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, item, this.ngGrid._config)
            && !this.hasCollisions(conf, item)
            && !this.isOutsideGrid(conf, {columns: this.ngGrid._config.maxCols, rows: this.ngGrid._config.maxRows})) {
            this.ngGrid._placeholderRef.instance.makeValid();
        } else {
            this.ngGrid._placeholderRef.instance.makeInvalid();
        }
        this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
        e.preventDefault();
    }

    @HostListener('dragleave', ['$event'])
    private dragLeave(e) {
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    @HostListener('drop', ['$event'])
    private drop(e) {
        const content = this.gridDragService.dragItemConf;
        this.gridDragService.dragItemConf = null;
        if (content) {
            const conf:NgGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
            conf.sizex = content.sizex;
            conf.sizey = content.sizey;
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, content, this.ngGrid._config)
                && !this.hasCollisions(conf, content)
                && !this.isOutsideGrid(conf, {
                    columns: this.ngGrid._config.maxCols,
                    rows: this.ngGrid._config.maxRows
                })) {
                const itemConfig = Object.assign(content, conf);
                this.newItemAdd$.next({
                    grid: this,
                    newConfig: itemConfig,
                    event: e
                });
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
    }

    public removeItemById(id:string) {
        this.items = this.items.filter(i => i.id != id);
    }

    public addItem(item:NgGridItemConfig) {
        this.items = this.items.concat([item]);
    }

    @HostListener('mousedown', ['$event'])
    private mouseDown(e) {
        const i = this.ngGrid.getItem(e);
        if (i && i.canDrag(e)) {
            this.gridDragService.dragStart(i, this, e);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    @HostListener('mouseup', ['$event'])
    private mouseUp(e:MouseEvent) {
        this.ngGrid._placeholderRef.instance.setSize(0, 0);
    }

    private toObserverEvent(event) {
        return {
            grid: this,
            event,
        };
    }
}