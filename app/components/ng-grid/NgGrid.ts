import {
    Directive,
    ElementRef,
    Renderer,
    EventEmitter,
    ComponentRef,
    KeyValueDiffer,
    KeyValueDiffers,
    OnInit,
    DoCheck,
    ViewContainerRef,
    Output, ComponentFactoryResolver, ComponentFactory
} from '@angular/core';

import {NgGridItem} from '../ng-grid-item/NgGridItem';
import {NgGridConfig} from './NgGridConfig';
import {NgGridPlaceholder} from './NgGridPlaceholder';
import {NgGridItemEvent} from '../ng-grid-item/NgGridItemEvent';
import {Observable} from 'rxjs/Rx';

@Directive({
    selector: '[ngGrid]',
    inputs: ['config: ngGrid']
})
export class NgGrid implements OnInit, DoCheck {
    private static CONST_DEFAULT_CONFIG: NgGridConfig = {
        id: '',
        margins: [10],
        draggable: true,
        resizable: true,
        maxCols: 0,
        maxRows: 0,
        visibleCols: 0,
        visibleRows: 0,
        colWidth: 250,
        rowHeight: 250,
        cascade: 'up',
        minWidth: 0,
        minHeight: 0,
        fixToGrid: false,
        autoStyle: true,
        autoResize: false,
        maintainRatio: false,
        preferNew: false,
        width: '100%',
        height: '100%'
    };

    @Output() public onDragStart: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onDrag: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onDragStop: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResizeStart: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResize: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResizeStop: EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onItemChange: EventEmitter<Array<NgGridItemEvent>> = new EventEmitter<Array<NgGridItemEvent>>();
    @Output() public itemDroppedIn: EventEmitter<any> = new EventEmitter<any>();

    public mouseMove: Observable<any>;
    public colWidth: number = 250;
    public rowHeight: number = 250;
    public minCols: number = 1;
    public minRows: number = 1;
    public marginTop: number = 10;
    public marginRight: number = 10;
    public marginBottom: number = 10;
    public marginLeft: number = 10;
    public isDragging: boolean = false;
    public isResizing: boolean = false;
    public autoStyle: boolean = true;
    public resizeEnable: boolean = true;
    public dragEnable: boolean = true;
    public cascade: string = 'up';
    public minWidth: number = 100;

    public minHeight: number = 100;
    public _items: Array<NgGridItem> = [];
    private _maxCols: number = 0;
    private _maxRows: number = 0;
    private _visibleCols: number = 0;
    private _visibleRows: number = 0;
    public _placeholderRef: ComponentRef<NgGridPlaceholder> = null;
    private _fixToGrid: boolean = false;
    private _autoResize: boolean = false;
    private _differ: KeyValueDiffer;
    private _maintainRatio: boolean = false;
    private _aspectRatio: number;

    private _preferNew: boolean = false;

    public _config = NgGrid.CONST_DEFAULT_CONFIG;


    constructor(private _differs: KeyValueDiffers,
                private _ngEl: ElementRef,
                private _renderer: Renderer,
                private cmpResolverFactory: ComponentFactoryResolver,
                private viewContainer: ViewContainerRef) {
    }

    get pagePosition() {
        return {
            pageX: this._ngEl.nativeElement.offsetLeft,
            pageY: this._ngEl.nativeElement.offsetTop
        };
    }

    set config(v: NgGridConfig) {
        this.setConfig(v);

        if (this._differ == null && v != null) {
            this._differ = this._differs.find(this._config).create(null);
        }
    }

    public ngOnInit(): void {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid', true);
        if (this.autoStyle) {
            this._renderer.setElementStyle(this._ngEl.nativeElement, 'position', 'relative');
        }
        this.setConfig(this._config);
        this.initPlaceholder();
    }

    public setConfig(config: NgGridConfig): void {
        this._config = config;

        this._autoResize = !!this._config.autoResize;
        this._preferNew = !!this._config.preferNew;
        this._maintainRatio = !!this._config.maintainRatio;
        this._fixToGrid = !!this._config.fixToGrid;
        this._visibleCols = Math.max(this._config.visibleCols, 0);
        this._visibleRows = Math.max(this._config.visibleRows, 0);

        this.setMargins(this._config.margins);

        this.rowHeight = this._config.rowHeight;
        this.colWidth = this._config.colWidth;
        this.resizeEnable = !!this._config.resizable;
        this.dragEnable = !!this._config.draggable;
        this.autoStyle = !!this._config.autoStyle;
        this.minWidth = this._config.minWidth || NgGrid.CONST_DEFAULT_CONFIG.minWidth;
        this.minHeight = this._config.minHeight || NgGrid.CONST_DEFAULT_CONFIG.minHeight;
        this.minCols = Math.max(this._config.minCols, 1);
        this.minRows = Math.max(this._config.minRows, 1);

        this._maxCols = Math.max(this._config.maxCols, 0);
        this._maxRows = Math.max(this._config.maxRows, 0);

        this.cascade = this._config.cascade;

        if (this._maintainRatio) {
            if (this.colWidth && this.rowHeight) {
                this._aspectRatio = this.colWidth / this.rowHeight;
            } else {
                this._maintainRatio = false;
            }
        }

        const maxWidth = this._maxCols * this.colWidth;
        const maxHeight = this._maxRows * this.rowHeight;

        if (maxWidth > 0 && this.minWidth > maxWidth) {
            this.minWidth = 0.75 * this.colWidth;
        }
        if (maxHeight > 0 && this.minHeight > maxHeight) {
            this.minHeight = 0.75 * this.rowHeight;
        }

        if (this.minWidth > this.colWidth) {
            this.minCols = Math.max(this.minCols, Math.ceil(this.minWidth / this.colWidth));
        }
        if (this.minHeight > this.rowHeight) {
            this.minRows = Math.max(this.minRows, Math.ceil(this.minHeight / this.rowHeight));
        }

        if (this._maxCols > 0 && this.minCols > this._maxCols) {
            this.minCols = 1;
        }
        if (this._maxRows > 0 && this.minRows > this._maxRows) {
            this.minRows = 1;
        }

        const width = config.colWidth * config.maxCols + 'px';
        const height = config.rowHeight * config.maxRows + 'px';

        this.setSize(width, height);
    }

    public getItemPosition(index: number): { col: number, row: number } {
        return this._items[index].getGridPosition();
    }

    public getItemSize(index: number): { x: number, y: number } {
        return this._items[index].getSize();
    }

    public ngDoCheck(): boolean {
        if (this._differ != null) {
            const changes = this._differ.diff(this._config);

            if (changes != null) {
                this._applyChanges(changes);

                return true;
            }
        }

        return false;
    }

    public setMargins(margins: Array<number>): void {
        this.marginTop = (margins[0]);
        this.marginRight = margins.length >= 2 ? (margins[1]) : this.marginTop;
        this.marginBottom = margins.length >= 3 ? (margins[2]) : this.marginTop;
        this.marginLeft = margins.length >= 4 ? (margins[3]) : this.marginRight;
    }

    public enableDrag(): void {
        this.dragEnable = true;
    }

    public disableDrag(): void {
        this.dragEnable = false;
    }

    public enableResize(): void {
        this.resizeEnable = true;
    }

    public disableResize(): void {
        this.resizeEnable = false;
    }

    public addItem(ngItem: NgGridItem): void {
        this._items.push(ngItem);
        ngItem.recalculateSelf();
    }

    public removeItem(ngItem: NgGridItem): void {
        this._items = this._items.filter(item => item !== ngItem);
        this._items.forEach((item) => item.recalculateSelf());
    }

    private _applyChanges(changes: any): void {
        changes.forEachAddedItem((record: any) => {
            this._config[record.key] = record.currentValue;
        });
        changes.forEachChangedItem((record: any) => {
            this._config[record.key] = record.currentValue;
        });
        changes.forEachRemovedItem((record: any) => {
            delete this._config[record.key];
        });

        this.setConfig(this._config);
    }

    private _calculateGridPosition(left: number, top: number): { col: number, row: number } {
        let col = Math.max(1, Math.round(left / (this.colWidth + this.marginLeft + this.marginRight)) + 1);
        let row = Math.max(1, Math.round(top / (this.rowHeight + this.marginTop + this.marginBottom)) + 1);

        if (!this._isWithinBoundsX({col: col, row: row}, {x: 1, y: 1})) {
            col = this._maxCols;
        }
        if (!this._isWithinBoundsY({col: col, row: row}, {x: 1, y: 1})) {
            row = this._maxRows;
        }

        return {'col': col, 'row': row};
    }

    private _isWithinBoundsX(pos: { col: number, row: number }, dims: { x: number, y: number }) {
        return (this._maxCols === 0 || (pos.col + dims.x - 1) <= this._maxCols);
    }

    private _isWithinBoundsY(pos: { col: number, row: number }, dims: { x: number, y: number }) {
        return (this._maxRows === 0 || (pos.row + dims.y - 1) <= this._maxRows);
    }

    private setSize(width: string, height: string) {
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', width);
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', height);
    }

    private _getMousePosition(e: any): { left: number, top: number } {
        if (((<any>window).TouchEvent && e instanceof TouchEvent) || (e.touches || e.changedTouches)) {
            e = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
        }
        const refPos = this._ngEl.nativeElement.getBoundingClientRect();

        let left = e.clientX - refPos.left;
        let top = e.clientY - refPos.top;

        if (this.cascade === 'down') {
            top = refPos.top + refPos.height - e.clientY;
        }
        if (this.cascade === 'right') {
            left = refPos.left + refPos.width - e.clientX;
        }

        return {
            left,
            top
        };
    }

    private _getItemFromPosition(position: { left: number, top: number }): NgGridItem {
        const isPositionInside = (size: {width: number, height: number}, pos: {left: number, top: number}) => {
            return position.left > (pos.left + this.marginLeft) &&
                position.left < (pos.left + this.marginLeft + size.width) &&
                position.top > (pos.top + this.marginTop) &&
                position.top < (pos.top + this.marginTop + size.height);
        };

        return this._items.find(el => isPositionInside(el.getDimensions(), el.getPosition()));
    }

    public getItem(e: MouseEvent) {
        return this._getItemFromPosition(this._getMousePosition(e));
    }

    public getGridPositionOfEvent(event: any, offset: any) {
        let {left, top} = this._getMousePosition(event);
        return this._calculateGridPosition(left - offset.left, top - offset.top);
    }

    private initPlaceholder() {
        this._createPlaceholder();
        this._placeholderRef.instance.setSize(0, 0);
    }

    private _createPlaceholder(): void {
        if (this._placeholderRef) {
            this._placeholderRef.destroy();
        }
        const factory: ComponentFactory<NgGridPlaceholder> = this.cmpResolverFactory.resolveComponentFactory(NgGridPlaceholder);
        this._placeholderRef = this.viewContainer.createComponent(factory);
        this._placeholderRef.changeDetectorRef.detectChanges();
        this._placeholderRef.instance.registerGrid(this);
    }
}
