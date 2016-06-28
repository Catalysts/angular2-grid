import {Injectable} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/share';
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/debounce";
import "rxjs/add/operator/combineLatest";

import {NgGridItem} from "../components/ng-grid-item/NgGridItem";
import {NgGridComponent} from "../components/ng-grid/NgGridComponent";
import {NgGridItemConfig} from "../components/ng-grid-item/NgGridItemConfig";

@Injectable()
export class GridDragService {
    public itemDragged$:Observable<any>;
    public itemReleased$:Subject<any> = new Subject();

    private windowMouseMove$:Observable<any>;
    private windowMouseUp$:Observable<any>;

    private releaseOutside:Observable<any>;
    private releaseOutsideSubscription:Subscription;

    public draggedItem:NgGridItem;
    public initialGrid:NgGridComponent;
    public dragItemConf:NgGridItemConfig;
    private grids:Array<NgGridComponent> = [];

    private posOffset:any = {};

    private windowDragOver$;
    private windowDrop$;

    public constructor(private window:Window) {
        this.windowMouseMove$ = Observable.fromEvent(this.window, 'mousemove').map(e => ({grid: null, event: e}));
        this.windowMouseUp$ = Observable.fromEvent(this.window, 'mouseup').map(e => ({grid: null, event: e}));
        this.windowDragOver$ = Observable.fromEvent(this.window, 'dragover').map(e => ({grid: null, event: e}));
        this.windowDrop$ = Observable.fromEvent(this.window, 'drop').map(e => ({grid: null, event: e}));

        this.itemDragged$ = this.windowMouseMove$.filter(() => !!this.draggedItem).map(event => ({
            item: this.draggedItem,
            event
        }));

        this.windowMouseUp$.subscribe(e => this.mouseUp(e));
    }

    public addGrid(grid:NgGridComponent) {
        const mouseMoveCombined = grid.mouseMove$.merge(this.windowMouseMove$)
            .distinct((a, b) => this.equalScreenPosition(a.event, b.event));
        const dragCombined = mouseMoveCombined
            .withLatestFrom(this.itemDragged$, (x, y) => ({
                itemDragged: y,
                event: x.event,
                grid: x.grid
            }));
        const inside = dragCombined.filter(it => it.grid != null);
        const outside = dragCombined.filter(it => it.grid == null);
        const release = this.itemReleased$.withLatestFrom(inside, (x, y) => ({release: x, move: y}))
            .filter(x => this.equalScreenPosition(x.release.event, x.move.event));

        grid.newItemAdd$.subscribe(v => {
            this.removeItemFromOldGrid(v.item, this.initialGrid);
            this.draggedItem = undefined;
            this.initialGrid = undefined;
        });
        this.itemDragged$.subscribe(v => this.mouseMove(v.event.event));
        this.grids.push(grid);
        return {
            inside,
            outside,
            release,
        };
    }

    private removeItemFromOldGrid(item, oldGrid) {
        oldGrid.removeItem(item.config);
    }

    public refreshAll() {
        this.grids.forEach(grid => grid.ngGrid.refreshGrid());
    }

    public mouseMove(event) {
        if (this.draggedItem) {
            this.draggedItem.setPosition(event.pageX - this.posOffset.left, event.pageY - this.posOffset.top);
        }
    }

    public mouseUp(event) {
        if (this.draggedItem) {
            this.itemReleased$.next({
                item: this.draggedItem,
                event: event.event,
            });
        }
        this.draggedItem = null;
        this.refreshAll();
    }

    public dragStart(item:NgGridItem, grid:NgGridComponent, event) {
        event.preventDefault();
        this.draggedItem = item;
        this.initialGrid = grid;
        const itemPos = item.getPosition();
        this.posOffset = {'left': (event.pageX - itemPos.left), 'top': (event.pageY - itemPos.top)};
        item.startMoving();
    }

    private equalScreenPosition(e1, e2):boolean {
        return e1.screenX == e2.screenX && e1.screenY == e2.screenY;
    }
}