import {
    Component,
    OnInit,
    Input,
    ViewChild,
    OnDestroy,
    HostListener
} from '@angular/core';

import {
    NgGridItem,
} from '../ng-grid-item/NgGridItem';

import {GridDragService} from '../../service/GridDragService';

import {
    NgGrid,
} from './NgGrid';
import {Subject} from 'rxjs/Rx';
import {NgGridItemConfig} from '../ng-grid-item/NgGridItemTypes';
import {GridValidationService} from '../../service/GridValidationService';
import {NgGridConfig} from './NgGridTypes';

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
    static GRID_POSITIONS_OFFSET = 1;

    @ViewChild(NgGrid) ngGrid: NgGrid;
    @Input() config: NgGridConfig;
    @Input() items: NgGridItemConfig[] = [];

    mouseMove$: Subject<any> = new Subject();
    newItemAdd$: Subject<any> = new Subject();

    private static isOutsideGrid(item: NgGridItemConfig, gridSize: any): boolean {
        const {col, row} = item;
        const {colSpan, rowSpan} = item;
        return (col + colSpan - NgGridComponent.GRID_POSITIONS_OFFSET > gridSize.columnsCount)
            || (row + rowSpan - NgGridComponent.GRID_POSITIONS_OFFSET > gridSize.rowsCount);
    }

    constructor(private gridDragService: GridDragService,
                private gridPositionService: GridValidationService) {
    }

    ngOnInit() {
        const {inside, outside, release} = this.gridDragService.registerGrid(this);
        inside.subscribe(v => this.itemDraggedInside(v));
        outside.subscribe(v => this.itemDragOutside(v));
        release.subscribe(v => this.itemReleased(v));
    }

    ngOnDestroy(): void {
        this.ngGrid.items.forEach(item => item.ngOnDestroy());
    }

    @HostListener('mousemove', ['$event'])
    mouseMove(e: any) {
        this.mouseMove$.next(this.toObserverEvent(e));
    }


    @HostListener('dragover', ['$event'])
    dragOver(e: any) {
        const item = this.gridDragService.dragItemConf;
        if (!item) {
            return;
        }
        const dims = {
            x: item.colSpan,
            y: item.rowSpan
        };
        const conf: NgGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
        conf.colSpan = dims.x;
        conf.rowSpan = dims.y;
        // this.ngGrid.placeholderRef.instance.setGridPosition(conf.col, conf.row);
        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, item, this.ngGrid.config)
            && !this.hasCollisions(conf, item)
            && !NgGridComponent.isOutsideGrid(conf, {
                columns: this.ngGrid.config.columnsCount,
                rows: this.ngGrid.config.rowsCount
            })) {
            // this.ngGrid.placeholderRef.instance.makeValid();
        } else {
            // this.ngGrid.placeholderRef.instance.makeInvalid();
        }
        // this.ngGrid.placeholderRef.instance.setSize(dims.x, dims.y);
        e.preventDefault();
    }

    @HostListener('dragleave', ['$event'])
    dragLeave(e: any) {
        // this.ngGrid.placeholderRef.instance.setSize(0, 0);
    }

    @HostListener('drop', ['$event'])
    drop(e: any) {
        const content = this.gridDragService.dragItemConf;
        this.gridDragService.dragItemConf = null;
        if (content) {
            const conf: NgGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
            conf.colSpan = content.colSpan;
            conf.rowSpan = content.rowSpan;
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, content, this.ngGrid.config)
                && !this.hasCollisions(conf, content)
                && !NgGridComponent.isOutsideGrid(conf, {
                    columns: this.ngGrid.config.columnsCount,
                    rows: this.ngGrid.config.rowsCount
                })) {
                const itemConfig = Object.assign(content, conf);
                this.newItemAdd$.next({
                    grid: this,
                    newConfig: itemConfig,
                    event: e
                });
            }
        }
        // this.ngGrid.placeholderRef.instance.setSize(0, 0);
    }

    @HostListener('mousedown', ['$event'])
    mouseDown(e: any) {
        const i = this.ngGrid.getItemFromEvent(e);
        console.log(i);
        if (i && i.canDrag()) {
            this.gridDragService.dragStart(i, this, e);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    @HostListener('mouseup', ['$event'])
    mouseUp(e: MouseEvent): void {
        // this.ngGrid.placeholderRef.instance.setSize(0, 0);
    }

    removeItem(item: NgGridItemConfig) {
        let removed = false;
        this.items = this.items.filter(i => {
            if (i.col === item.col && i.row === item.row && !removed) {
                removed = true;
                return false;
            } else {
                return true;
            }
        });
    }

    removeItemById(id: string) {
        this.items = this.items.filter(i => i.id !== id);
    }

    addItem(item: NgGridItemConfig) {
        this.items = this.items.concat([item]);
    }

    itemDraggedInside(v: any) {
        if (this.gridDragService.draggedItem) {
            const {item, event} = v.itemDragged;

            const conf = this.itemConfigFromEvent(item.config, event.event);
            // const dims = item.getGridSize();
            if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.itemDragged.item, this.ngGrid.config)
                && !this.hasCollisions(conf, v.itemDragged.item.config)
                && !NgGridComponent.isOutsideGrid(conf, {
                    columns: this.ngGrid.config.columnsCount,
                    rows: this.ngGrid.config.rowsCount
                })) {
                // this.ngGrid.placeholderRef.instance.makeValid();
            } else {
                // this.ngGrid.placeholderRef.instance.makeInvalid();
            }
            // this.ngGrid.placeholderRef.instance.setSize(dims.x, dims.y);
            // this.ngGrid.placeholderRef.instance.setGridPosition(conf.col, conf.row);
        }
    }

    itemDragOutside(v: any) {
        // this.ngGrid.placeholderRef.instance.setSize(0, 0);
    }

    itemReleased(v: any) {
        const conf = this.itemConfigFromEvent(v.release.item.config, v.move.event);

        if (this.gridPositionService.validateGridPosition(conf.col, conf.row, v.release.item, this.ngGrid.config)
            && !this.hasCollisions(conf, v.release.item.config)
            && !NgGridComponent.isOutsideGrid(conf, {
                columns: this.ngGrid.config.columnsCount,
                rows: this.ngGrid.config.rowsCount
            })) {
            this.newItemAdd$.next({
                grid: this,
                newConfig: conf,
                oldConfig: v.release.item.config,
                event: v.release.event
            });
        }
        v.release.item.stopMoving();
        // this.ngGrid.placeholderRef.instance.setSize(0, 0);
    }

    private itemConfigFromEvent(config: NgGridItemConfig, event: MouseEvent): NgGridItemConfig {
        const {col, row} = this.ngGrid.getGridPositionOfEvent(event, this.gridDragService.posOffset);
        return Object.assign({}, config, {col, row});
    }

    private hasCollisions(itemConf: NgGridItemConfig, initialConf: NgGridItemConfig): boolean {
        return this.items
            .filter(c => !(c.col === initialConf.col && c.row === initialConf.row))
            .some((conf: NgGridItemConfig) => intersect(
                toRectangle(conf), toRectangle(itemConf)
            ));

        function intersect(r1: any, r2: any) {
            return !(r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
        }

        function toRectangle(conf: NgGridItemConfig) {
            return {
                left: conf.col,
                top: conf.row,
                right: conf.col + conf.colSpan - 1,
                bottom: conf.row + conf.rowSpan - 1
            };
        }
    }

    private toObserverEvent(event: any) {
        return {
            grid: this,
            event,
        };
    }
}
