import {Injectable} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/share';
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/debounce";
import "rxjs/add/operator/combineLatest";

import {NgGridItem} from "../components/ng-grid-item/NgGridItem";
import {NgGridComponent} from "../components/ng-grid/NgGridComponent";
import {NgGridItemConfig} from "../components/ng-grid-item/NgGridItemConfig";
import {NgGridWrapper} from "src/NgGridWrapper";
import {isArray} from "@angular/core/src/facade/lang";

export interface GridDragEvent {
    grid:NgGridComponent,
    event:any,
    item:NgGridItem
}

@Injectable()
export class GridDragService {
    private window = window;
    public itemDragged$:Observable<any>;
    public itemReleased$:Subject<any> = new Subject();
    public itemAdded$:Subject<any> = new Subject();

    private windowMouseMove$:Observable<any>;
    private windowMouseUp$:Observable<any>;
    private windowDragOver$:Observable<any>;
    private windowDrop$:Observable<any>;

    public draggedItem:NgGridItem;
    public initialGrid:NgGridComponent;
    public dragItemConf:NgGridItemConfig;
    private grids:Array<NgGridComponent> = [];

    public posOffset:any = {};

    private removing:boolean = false;

    public constructor() {
        this.windowMouseMove$ = Observable.fromEvent(this.window, 'mousemove').map(e => ({grid: null, event: e}));
        this.windowMouseUp$ = Observable.fromEvent(this.window, 'mouseup').map(e => ({
            grid: null,
            event: e,
            item: this.draggedItem
        }));
        this.windowDragOver$ = Observable.fromEvent(this.window, 'dragover').map(e => ({grid: null, event: e}));
        this.windowDrop$ = Observable.fromEvent(this.window, 'drop').map(e => ({grid: null, event: e}));

        this.itemDragged$ = this.windowMouseMove$
            .filter(() => !!this.draggedItem)
            .map(event => ({
                item: this.draggedItem,
                event
            }));

        this.windowMouseUp$.subscribe(e => this.mouseUp(e));
    }

    public removeItemById(id:string) {
        this.removing = true;
        this.grids.forEach(grid => {
            if (grid.items.map(item => item.id).includes(id)) {
                grid.removeItemById(id);
                this.removing = false;
                this.changeSubgridItemsConfig(grid.ngGrid._config.id, grid.items);
            }
        });
    }

    public getPlacedItems() {
        return this.grids[0].items;
    }

    public registerGrid(grid:NgGridComponent) {
        const mouseMoveCombined = grid.mouseMove$.merge(this.windowMouseMove$)
            .distinct((a, b) => GridDragService.equalScreenPosition(a.event, b.event));
        const dragCombined = mouseMoveCombined
            .withLatestFrom(this.itemDragged$, (x, y) => ({
                itemDragged: y,
                event: x.event,
                grid: x.grid
            }));
        const inside = dragCombined.filter(it => it.grid != null);
        const outside = dragCombined.filter(it => it.grid == null);
        const release = this.itemReleased$.withLatestFrom(inside, (x, y) => ({release: x, move: y}))
            .filter(x => GridDragService.equalScreenPosition(x.release.event, x.move.event));
        grid.newItemAdd$
            .merge(this.windowMouseUp$)
            .distinct((a, b) => GridDragService.equalScreenPosition(a.event, b.event))
            .filter(x => !x.grid)
            .subscribe((x) => {
                if (this.initialGrid && this.draggedItem) {
                    this.initialGrid.removeItem(this.draggedItem.config);
                    this.initialGrid.addItem(this.draggedItem.config);
                    this.draggedItem = undefined;
                    this.initialGrid = undefined;
                }
            });

        grid.newItemAdd$.subscribe(v => {
            if (this.initialGrid) {
                this.initialGrid.removeItem(v.oldConfig);
                this.changeSubgridItemsConfig(this.initialGrid.ngGrid._config.id, this.initialGrid.items);
            }
            this.draggedItem = undefined;
            this.initialGrid = undefined;
            this.changeSubgridItemsConfig(grid.ngGrid._config.id, grid.items.concat(v.newConfig));
            grid.addItem(v.newConfig);
            this.itemAdded$.next(this.getPlacedItems());
        });
        this.itemDragged$.subscribe(v => this.mouseMove(v.event.event));
        this.grids.push(grid);
        return {
            inside,
            outside,
            release
        };
    }

    private changeSubgridItemsConfig(id:string, items:NgGridItemConfig[]) {
        const placedItems = this.getPlacedItems();
        const subgridIndex = placedItems
            .findIndex(item => item.id === id && isArray(item.component.data.items));
        if (subgridIndex > -1) {
            placedItems[subgridIndex].component.data.items = items;
        }
    }

    public mouseMove(event) {
        if (this.draggedItem) {
            this.draggedItem.move(event, this.posOffset);
        }
    }

    public mouseUp(event) {
        if (this.draggedItem) {
            this.itemReleased$.next({
                item: this.draggedItem,
                event: event.event,
            });
        }
    }

    public dragStart(item:NgGridItem, grid:NgGridComponent, event) {
        event.preventDefault();
        this.draggedItem = item;
        this.initialGrid = grid;
        const itemPos = item.getPagePosition();
        this.posOffset = {'left': (event.pageX - itemPos.left), 'top': (event.pageY - itemPos.top)};
        item.startMoving();
    }

    private static equalScreenPosition(e1, e2):boolean {
        return e1.screenX == e2.screenX && e1.screenY == e2.screenY;
    }
}