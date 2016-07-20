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
    Output, ComponentResolver, ComponentFactory, ApplicationRef
} from '@angular/core';

import {NgGridItem} from '../ng-grid-item/NgGridItem';
import {NgGridConfig} from './NgGridConfig';
import {NgGridPlaceholder} from './NgGridPlaceholder';
import {NgGridItemEvent} from '../ng-grid-item/NgGridItemEvent';
import {Observable} from "rxjs/Rx";

@Directive({
    selector: '[ngGrid]',
    inputs: ['config: ngGrid'],
    host: {
        '(mousedown)': '_onMouseDown($event)',
        '(mousemove)': '_onMouseMove($event)',
        '(mouseup)': '_onMouseUp($event)',
        '(touchstart)': '_onMouseDown($event)',
        '(touchmove)': '_onMouseMove($event)',
        '(touchend)': '_onMouseUp($event)',
        '(window:resize)': '_onResize($event)',
        '(document:mousemove)': '_onMouseMove($event)',
        '(document:mouseup)': '_onMouseUp($event)',
    }
})
export class NgGrid implements OnInit, DoCheck {
    //	Event Emitters
    @Output() public onDragStart:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onDrag:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onDragStop:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResizeStart:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResize:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onResizeStop:EventEmitter<NgGridItem> = new EventEmitter<NgGridItem>();
    @Output() public onItemChange:EventEmitter<Array<NgGridItemEvent>> = new EventEmitter<Array<NgGridItemEvent>>();
    @Output() public itemDroppedIn:EventEmitter<any> = new EventEmitter<any>();

    public mouseMove:Observable<any>;

    //	Public variables
    public colWidth:number = 250;
    public rowHeight:number = 250;
    public minCols:number = 1;
    public minRows:number = 1;
    public marginTop:number = 10;
    public marginRight:number = 10;
    public marginBottom:number = 10;
    public marginLeft:number = 10;
    public isDragging:boolean = false;
    public isResizing:boolean = false;
    public autoStyle:boolean = true;
    public resizeEnable:boolean = true;
    public dragEnable:boolean = true;
    public cascade:string = 'up';
    public minWidth:number = 100;
    public minHeight:number = 100;

    //	Private variables
    private _items:Array<NgGridItem> = [];
    private _draggingItem:NgGridItem = null;
    private _resizingItem:NgGridItem = null;
    private _resizeDirection:string = null;
    private _itemGrid:{ [key:number]:{ [key:number]:NgGridItem } } = {1: {1: null}};
    // private _containerWidth:number;
    // private _containerHeight:number;
    private _maxCols:number = 0;
    private _maxRows:number = 0;
    private _visibleCols:number = 0;
    private _visibleRows:number = 0;
    // private _setWidth:number = 250;
    // private _setHeight:number = 250;
    private _posOffset:{ left:number, top:number } = null;
    // private _adding:boolean = false;
    public _placeholderRef:ComponentRef<NgGridPlaceholder> = null;
    private _fixToGrid:boolean = false;
    private _autoResize:boolean = false;
    private _differ:KeyValueDiffer;
    private _maintainRatio:boolean = false;
    private _aspectRatio:number;
    private _preferNew:boolean = false;

    private itemInitialPosition:any;

    //	Default config
    private static CONST_DEFAULT_CONFIG:NgGridConfig = {
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
        minWidth: 100,
        minHeight: 100,
        fixToGrid: false,
        autoStyle: true,
        autoResize: false,
        maintainRatio: false,
        preferNew: false,
        width: '100%',
        height: '100%'
    };
    public _config = NgGrid.CONST_DEFAULT_CONFIG;


    constructor(private _differs:KeyValueDiffers,
                private _ngEl:ElementRef,
                private _renderer:Renderer,
                private cmpResolver:ComponentResolver,
                private viewContainer:ViewContainerRef,
                private appRef:ApplicationRef) {
    }

    get pagePosition() {
        return {
            pageX: this._ngEl.nativeElement.offsetLeft,
            pageY: this._ngEl.nativeElement.offsetTop
        };
    }

    //	[ng-grid] attribute handler
    set config(v:NgGridConfig) {
        this.setConfig(v);

        if (this._differ == null && v != null) {
            this._differ = this._differs.find(this._config).create(null);
        }
    }

    public ngOnInit():void {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid', true);
        if (this.autoStyle) this._renderer.setElementStyle(this._ngEl.nativeElement, 'position', 'relative');
        this.setConfig(this._config);
        this.initPlaceholder();
    }

    public setConfig(config:NgGridConfig):void {
        this._config = config;

        let maxColRowChanged = false;

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

        maxColRowChanged = maxColRowChanged || this._maxCols != Math.max(this._config.maxCols, 0);
        this._maxCols = Math.max(this._config.maxCols, 0);

        maxColRowChanged = maxColRowChanged || this._maxRows != Math.max(this._config.maxRows, 0);
        this._maxRows = Math.max(this._config.maxRows, 0);

        this.cascade = this._config.cascade;

        if (this._maintainRatio) {
            if (this.colWidth && this.rowHeight) {
                this._aspectRatio = this.colWidth / this.rowHeight;
            } else {
                this._maintainRatio = false;
            }
        }

        if (maxColRowChanged) {
            this.rearrangeItems();
        }

        this._calculateRowHeight();
        this._calculateColWidth();

        var maxWidth = this._maxCols * this.colWidth;
        var maxHeight = this._maxRows * this.rowHeight;

        if (maxWidth > 0 && this.minWidth > maxWidth) this.minWidth = 0.75 * this.colWidth;
        if (maxHeight > 0 && this.minHeight > maxHeight) this.minHeight = 0.75 * this.rowHeight;

        if (this.minWidth > this.colWidth) this.minCols = Math.max(this.minCols, Math.ceil(this.minWidth / this.colWidth));
        if (this.minHeight > this.rowHeight) this.minRows = Math.max(this.minRows, Math.ceil(this.minHeight / this.rowHeight));

        if (this._maxCols > 0 && this.minCols > this._maxCols) this.minCols = 1;
        if (this._maxRows > 0 && this.minRows > this._maxRows) this.minRows = 1;

        this._updateRatio();

        this._items.forEach(item => {
            this._removeFromGrid(item);
            item.recalculateSelf();
            this._addToGrid(item);
        });

        this._cascadeGrid();
        this._updateSize();

        const width = config.width ? config.width + 'px' : NgGrid.CONST_DEFAULT_CONFIG.width;
        const height = config.height ? config.height + 'px' : NgGrid.CONST_DEFAULT_CONFIG.height;

        this.setSize(width, height);
    }

    public getItemPosition(index:number):{ col:number, row:number } {
        return this._items[index].getGridPosition();
    }

    public getItemSize(index:number):{ x:number, y:number } {
        return this._items[index].getSize();
    }

    public ngDoCheck():boolean {
        if (this._differ != null) {
            var changes = this._differ.diff(this._config);

            if (changes != null) {
                this._applyChanges(changes);

                return true;
            }
        }

        return false;
    }

    public setMargins(margins:Array<number>):void {
        this.marginTop = (margins[0]);
        this.marginRight = margins.length >= 2 ? (margins[1]) : this.marginTop;
        this.marginBottom = margins.length >= 3 ? (margins[2]) : this.marginTop;
        this.marginLeft = margins.length >= 4 ? (margins[3]) : this.marginRight;
    }

    public enableDrag():void {
        this.dragEnable = true;
    }

    public disableDrag():void {
        this.dragEnable = false;
    }

    public enableResize():void {
        this.resizeEnable = true;
    }

    public disableResize():void {
        this.resizeEnable = false;
    }

    public addItem(ngItem:NgGridItem):void {
        if (!this._preferNew) {
            var newPos = this._fixGridPosition(ngItem.getGridPosition(), ngItem.getSize());
            ngItem.setGridPosition(newPos.col, newPos.row);
        }
        this._items.push(ngItem);
        this._addToGrid(ngItem);
        ngItem.recalculateSelf();
        ngItem.onCascadeEvent();
    }

    public removeItem(ngItem:NgGridItem):void {
        this._removeFromGrid(ngItem);

        this._items = this._items.filter(item => item != ngItem);

        this._cascadeGrid();
        this._updateSize();
        this._items.forEach((item) => item.recalculateSelf());
    }

    public updateItem(ngItem:NgGridItem) {
        this._removeFromGrid(ngItem);
        this._addToGrid(ngItem);
        this._cascadeGrid();
        this._updateSize();
        ngItem.onCascadeEvent();
    }

    public triggerCascade():void {
        this._cascadeGrid();
    }

    //	Private methods
    private rearrangeItems():void {
        if (this._maxCols > 0 && this._maxRows > 0) {	//	Can't have both, prioritise on cascade
            switch (this.cascade) {
                case "left":
                case "right":
                    this._maxCols = 0;
                    break;
                case "up":
                case "down":
                default:
                    this._maxRows = 0;
                    break;
            }
        }

        for (var x in this._items) {
            var pos = this._items[x].getGridPosition();
            var dims = this._items[x].getSize();

            this._removeFromGrid(this._items[x]);

            if (this._maxCols > 0 && dims.x > this._maxCols) {
                dims.x = this._maxCols;
                this._items[x].setSize(dims.x, dims.y);
            } else if (this._maxRows > 0 && dims.y > this._maxRows) {
                dims.y = this._maxRows;
                this._items[x].setSize(dims.x, dims.y);
            }

            if (this._hasGridCollision(pos, dims) || !this._isWithinBounds(pos, dims)) {
                var newPosition = this._fixGridPosition(pos, dims);
                this._items[x].setGridPosition(newPosition.col, newPosition.row);
            }

            this._addToGrid(this._items[x]);
        }

        this._cascadeGrid();
    }

    private _calculateColWidth():void {
        if (this._autoResize) {
            if (this._maxCols > 0 || this._visibleCols > 0) {
                var maxCols = this._maxCols > 0 ? this._maxCols : this._visibleCols;
                var maxWidth:number = this._ngEl.nativeElement.getBoundingClientRect().width;

                var colWidth:number = Math.floor(maxWidth / maxCols);
                colWidth -= (this.marginLeft + this.marginRight);
                if (colWidth > 0) this.colWidth = colWidth;

                if (this.colWidth < this.minWidth || this.minCols > this._config.minCols) {
                    this.minCols = Math.max(this._config.minCols, Math.ceil(this.minWidth / this.colWidth));
                }
            }
        }
    }

    private _calculateRowHeight():void {
        if (this._autoResize) {
            if (this._maxRows > 0 || this._visibleRows > 0) {
                var maxRows = this._maxRows > 0 ? this._maxRows : this._visibleRows;
                var maxHeight:number = window.innerHeight;

                var rowHeight:number = Math.max(Math.floor(maxHeight / maxRows), this.minHeight);
                rowHeight -= (this.marginTop + this.marginBottom);
                if (rowHeight > 0) this.rowHeight = rowHeight;

                if (this.rowHeight < this.minHeight || this.minRows > this._config.minRows) {
                    this.minRows = Math.max(this._config.minRows, Math.ceil(this.minHeight / this.rowHeight));
                }
            }
        }
    }

    private _updateRatio():void {
        if (this._autoResize && this._maintainRatio) {
            if (this._maxCols > 0 && this._visibleRows <= 0) {
                this.rowHeight = this.colWidth / this._aspectRatio;
            } else if (this._maxRows > 0 && this._visibleCols <= 0) {
                this.colWidth = this._aspectRatio * this.rowHeight;
            } else if (this._maxCols == 0 && this._maxRows == 0) {
                if (this._visibleCols > 0) {
                    this.rowHeight = this.colWidth / this._aspectRatio;
                } else if (this._visibleRows > 0) {
                    this.colWidth = this._aspectRatio * this.rowHeight;
                }
            }
        }
    }

    public refreshGrid():void {
        this._calculateColWidth();
        this._calculateRowHeight();

        this._updateRatio();

        for (var x in this._items) {
            this._removeFromGrid(this._items[x]);
            this._items[x].recalculateSelf();
            this._addToGrid(this._items[x]);
        }

        this._cascadeGrid();
        this._updateSize();
    }

    private _onResize():void {
        this.refreshGrid();
    }

    private _applyChanges(changes:any):void {
        changes.forEachAddedItem((record:any) => {
            this._config[record.key] = record.currentValue;
        });
        changes.forEachChangedItem((record:any) => {
            this._config[record.key] = record.currentValue;
        });
        changes.forEachRemovedItem((record:any) => {
            delete this._config[record.key];
        });

        this.setConfig(this._config);
    }

    private _onMouseDown(e:any) {
        // var mousePos = this._getMousePosition(e);
        // var item = this._getItemFromPosition(mousePos);
        //
        // if (item != null) {
        //     if (this.resizeEnable && item.canResize(e) != null) {
        //         this._resizeStart(e);
        //         return false;
        //     } else if (this.dragEnable && item.canDrag(e)) {
        //         // this._dragStart(e);
        //         this.gridDragService.dragStart(item, e);
        //         return false;
        //     }
        // }

        // return true;
    }

    private _resizeStart(e:any):void {
        if (this.resizeEnable) {
            var mousePos = this._getMousePosition(e);
            var item = this._getItemFromPosition(mousePos);

            item.startMoving();
            this._resizingItem = item;
            this._resizeDirection = item.canResize(e);
            this._removeFromGrid(item);
            this._createPlaceholder(item);
            this.isResizing = true;

            this.onResizeStart.emit(item);
            item.onResizeStartEvent();
        }
    }

    private _dragStart(e:any):void {
        if (this.dragEnable) {
            var mousePos = this._getMousePosition(e);
            var item = this._getItemFromPosition(mousePos);
            var itemPos = item.getPosition();

            this.itemInitialPosition = itemPos;

            var pOffset = {'left': (mousePos.left - itemPos.left), 'top': (mousePos.top - itemPos.top)};

            item.startMoving();
            this._draggingItem = item;
            this._posOffset = pOffset;
            this._removeFromGrid(item);
            this._createPlaceholder(item);
            this.isDragging = true;

            this.onDragStart.emit(item);
            item.onDragStartEvent();
        }
    }

    private _onMouseMove(e:any):void {
        // this.gridDragService.mouseMove(e);
        // if (e.buttons == 0 && this.isDragging) {
        //     this._dragStop(e);
        // } else if (e.buttons == 0 && this.isResizing) {
        //     this._resizeStop();
        // } else if (this.isDragging) {
        //     this._drag(e);
        // } else if (this.isResizing) {
        //     this._resize(e);
        // } else {
        //     var mousePos = this._getMousePosition(e);
        //     var item = this._getItemFromPosition(mousePos);
        //
        //     if (item) {
        //         item.onMouseMove(e);
        //     }
        // }
    }

    private _drag(e:any):void {
        if (this.isDragging) {
            var mousePos = this._getMousePosition(e);
            var newL = (mousePos.left - this._posOffset.left);
            var newT = (mousePos.top - this._posOffset.top);

            var itemPos = this._draggingItem.getGridPosition();
            var gridPos = this._calculateGridPosition(newL, newT);
            var dims = this._draggingItem.getSize();

            if (!this._isWithinBoundsX(gridPos, dims))
                gridPos.col = this._maxCols - (dims.x - 1);

            if (!this._isWithinBoundsY(gridPos, dims))
                gridPos.row = this._maxRows - (dims.y - 1);

            if (gridPos.col != itemPos.col || gridPos.row != itemPos.row) {
                this._draggingItem.setGridPosition(gridPos.col, gridPos.row, false);
                this._placeholderRef.instance.setGridPosition(gridPos.col, gridPos.row);

                if (['up', 'down', 'left', 'right'].indexOf(this.cascade) >= 0) {
                    // this._fixGridCollisions(gridPos, dims);
                    this._cascadeGrid(gridPos, dims);
                }
            }
            if (!this._fixToGrid) {
                this._draggingItem.setPosition(newL, newT);
            }

            this.onDrag.emit(this._draggingItem);
            this._draggingItem.onDragEvent();
        }
    }

    private _resize(e:any):void {
        if (this.isResizing) {
            var mousePos = this._getMousePosition(e);
            var itemPos = this._resizingItem.getPosition();
            var itemDims = this._resizingItem.getDimensions();
            var newW = this._resizeDirection == 'height' ? itemDims.width : (mousePos.left - itemPos.left + 10);
            var newH = this._resizeDirection == 'width' ? itemDims.height : (mousePos.top - itemPos.top + 10);

            if (newW < this.minWidth)
                newW = this.minWidth;
            if (newH < this.minHeight)
                newH = this.minHeight;

            var calcSize = this._calculateGridSize(newW, newH);
            var itemSize = this._resizingItem.getSize();
            var iGridPos = this._resizingItem.getGridPosition();

            if (!this._isWithinBoundsX(iGridPos, calcSize))
                calcSize.x = (this._maxCols - iGridPos.col) + 1;

            if (!this._isWithinBoundsY(iGridPos, calcSize))
                calcSize.y = (this._maxRows - iGridPos.row) + 1;

            if (calcSize.x != itemSize.x || calcSize.y != itemSize.y) {
                this._resizingItem.setSize(calcSize.x, calcSize.y, false);
                this._placeholderRef.instance.setSize(calcSize.x, calcSize.y);

                if (['up', 'down', 'left', 'right'].indexOf(this.cascade) >= 0) {
                    this._fixGridCollisions(iGridPos, calcSize);
                    this._cascadeGrid(iGridPos, calcSize);
                }
            }

            if (!this._fixToGrid)
                this._resizingItem.setDimensions(newW, newH);

            var bigGrid = this._maxGridSize(itemPos.left + newW + (2 * e.movementX), itemPos.top + newH + (2 * e.movementY));

            if (this._resizeDirection == 'height') bigGrid.x = iGridPos.col + itemSize.x;
            if (this._resizeDirection == 'width') bigGrid.y = iGridPos.row + itemSize.y;

            this.onResize.emit(this._resizingItem);
            this._resizingItem.onResizeEvent();
        }
    }

    private _onMouseUp(e:any):boolean {
        // this.gridDragService.mouseUp(e);
        if (this.isDragging) {
            this._dragStop(e);
            return false;
        } else if (this.isResizing) {
            this._resizeStop();
            return false;
        }

        return true;
    }

    private _dragStop(e:any):void {
        if (this.isDragging) {
            this.isDragging = false;

            const mousePos = this._getMousePosition(e);
            const newL = (mousePos.left - this._posOffset.left);
            const newT = (mousePos.top - this._posOffset.top);
            const gridPos = this._calculateGridPosition(newL, newT);

            this._addToGrid(this._draggingItem, gridPos);

            this._cascadeGrid();

            this._draggingItem.stopMoving();
            this._draggingItem.onDragStopEvent();
            this.onDragStop.emit(this._draggingItem);
            this._draggingItem = null;
            this._posOffset = null;
            // this._placeholderRef.destroy();

            this.onItemChange.emit(this._items.map(item => item.getEventOutput()));
        }
    }

    private _resizeStop():void {
        if (this.isResizing) {
            this.isResizing = false;

            var itemDims = this._resizingItem.getSize();

            this._resizingItem.setSize(itemDims.x, itemDims.y);

            this._addToGrid(this._resizingItem);

            this._cascadeGrid();

            this._resizingItem.stopMoving();
            this._resizingItem.onResizeStopEvent();
            this.onResizeStop.emit(this._resizingItem);
            this._resizingItem = null;
            this._resizeDirection = null;
            // this._placeholderRef.destroy();

            this.onItemChange.emit(this._items.map(item => item.getEventOutput()));
        }
    }

    private _maxGridSize(w:number, h:number):{ x:number, y:number } {
        var sizex = Math.ceil(w / (this.colWidth + this.marginLeft + this.marginRight));
        var sizey = Math.ceil(h / (this.rowHeight + this.marginTop + this.marginBottom));
        return {'x': sizex, 'y': sizey};
    }

    private _calculateGridSize(width:number, height:number):{ x:number, y:number } {
        width += this.marginLeft + this.marginRight;
        height += this.marginTop + this.marginBottom;

        var sizex = Math.max(this.minCols, Math.round(width / (this.colWidth + this.marginLeft + this.marginRight)));
        var sizey = Math.max(this.minRows, Math.round(height / (this.rowHeight + this.marginTop + this.marginBottom)));

        if (!this._isWithinBoundsX({col: 1, row: 1}, {x: sizex, y: sizey})) sizex = this._maxCols;
        if (!this._isWithinBoundsY({col: 1, row: 1}, {x: sizex, y: sizey})) sizey = this._maxRows;

        return {'x': sizex, 'y': sizey};
    }

    private _calculateGridPosition(left:number, top:number):{ col:number, row:number } {
        var col = Math.max(1, Math.round(left / (this.colWidth + this.marginLeft + this.marginRight)) + 1);
        var row = Math.max(1, Math.round(top / (this.rowHeight + this.marginTop + this.marginBottom)) + 1);

        if (!this._isWithinBoundsX({col: col, row: row}, {x: 1, y: 1})) col = this._maxCols;
        if (!this._isWithinBoundsY({col: col, row: row}, {x: 1, y: 1})) row = this._maxRows;

        return {'col': col, 'row': row};
    }

    private _hasGridCollision(pos:{ col:number, row:number }, dims:{ x:number, y:number }):boolean {
        var positions = this._getCollisions(pos, dims);

        if (positions == null || positions.length == 0) return false;

        return positions.some(function (v) {
            return !(v === null);
        });
    }

    private _getCollisions(pos:{ col:number, row:number }, dims:{ x:number, y:number }):Array<NgGridItem> {
        var returns:Array<NgGridItem> = [];

        for (var j = 0; j < dims.y; j++)
            if (this._itemGrid[pos.row + j] != null)
                for (var i = 0; i < dims.x; i++)
                    if (this._itemGrid[pos.row + j][pos.col + i] != null)
                        returns.push(this._itemGrid[pos.row + j][pos.col + i]);

        return returns;
    }

    private _fixGridCollisions(pos:{ col:number, row:number }, dims:{ x:number, y:number }):void {
        while (this._hasGridCollision(pos, dims)) {
            var collisions = this._getCollisions(pos, dims);

            this._removeFromGrid(collisions[0]);

            const initialPosition = collisions[0].getGridPosition();
            var itemPos = initialPosition;
            var itemDims = collisions[0].getSize();

            switch (this.cascade) {
                case "up":
                case "down":
                default:
                    if (!this._isWithinBoundsY(itemPos, itemDims))
                        itemPos.col++;
                    else
                        itemPos.row++;
                    break;
                case "left":
                case "right":
                    if (!this._isWithinBoundsX(itemPos, itemDims))
                        itemPos.row++;
                    else
                        itemPos.col++;
                    break;
            }

            const changed = collisions[0].setGridPosition(itemPos.col, itemPos.row);

            if (!changed) {
                collisions[0].setGridPosition(initialPosition.col, initialPosition.row);
                this._addToGrid(collisions[0]);
                return;
            }

            this._fixGridCollisions(itemPos, itemDims);
            this._addToGrid(collisions[0]);
            collisions[0].onCascadeEvent();
        }
    }

    private _cascadeGrid(pos?:{ col:number, row:number }, dims?:{ x:number, y:number }):void {
        if (pos && !dims) throw new Error("Cannot cascade with only position and not dimensions");

        if (this.isDragging && this._draggingItem && !pos && !dims) {
            pos = this._draggingItem.getGridPosition();
            dims = this._draggingItem.getSize();
        } else if (this.isResizing && this._resizingItem && !pos && !dims) {
            pos = this._resizingItem.getGridPosition();
            dims = this._resizingItem.getSize();
        }

        switch (this.cascade) {
            case "up":
            case "down":
                var lowRow:Array<number> = [0];

                for (var i:number = 1; i <= this._getMaxCol(); i++)
                    lowRow[i] = 1;

                for (var r:number = 1; r <= this._getMaxRow(); r++) {
                    if (this._itemGrid[r] == undefined) continue;

                    for (var c:number = 1; c <= this._getMaxCol(); c++) {
                        if (this._itemGrid[r] == undefined) break;
                        if (r < lowRow[c]) continue;

                        if (this._itemGrid[r][c] != null) {
                            var item = this._itemGrid[r][c];
                            if (item.isFixed) continue;

                            var itemDims = item.getSize();
                            var itemPos = item.getGridPosition();

                            if (itemPos.col != c || itemPos.row != r) continue;	//	If this is not the element's start

                            var lowest = lowRow[c];

                            for (var i:number = 1; i < itemDims.x; i++) {
                                lowest = Math.max(lowRow[(c + i)], lowest);
                            }

                            if (pos && (c + itemDims.x) > pos.col && c < (pos.col + dims.x)) {          //	If our element is in one of the item's columns
                                if ((r >= pos.row && r < (pos.row + dims.y)) ||                         //	If this row is occupied by our element
                                    ((itemDims.y > (pos.row - lowest)) &&                               //	Or the item can't fit above our element
                                    (r >= (pos.row + dims.y) && lowest < (pos.row + dims.y)))) {    //		And this row is below our element, but we haven't caught it
                                    lowest = Math.max(lowest, pos.row + dims.y);                        //	Set the lowest row to be below it
                                }
                            }

                            if (lowest != itemPos.row) {	//	If the item is not already on this row move it up
                                this._removeFromGrid(item);
                                item.setGridPosition(c, lowest);
                                item.onCascadeEvent();
                                this._addToGrid(item);
                            }

                            for (var i:number = 0; i < itemDims.x; i++) {
                                lowRow[c + i] = lowest + itemDims.y;	//	Update the lowest row to be below the item
                            }

                        }
                    }
                }
                break;
            case "left":
            case "right":
                var lowCol:Array<number> = [0];

                for (var i:number = 1; i <= this._getMaxRow(); i++)
                    lowCol[i] = 1;

                for (var r:number = 1; r <= this._getMaxRow(); r++) {
                    if (this._itemGrid[r] == undefined) continue;

                    for (var c:number = 1; c <= this._getMaxCol(); c++) {
                        if (this._itemGrid[r] == undefined) break;
                        if (c < lowCol[r]) continue;

                        if (this._itemGrid[r][c] != null) {
                            var item = this._itemGrid[r][c];
                            var itemDims = item.getSize();
                            var itemPos = item.getGridPosition();

                            if (itemPos.col != c || itemPos.row != r) continue;	//	If this is not the element's start

                            var lowest = lowCol[r];

                            for (var i:number = 1; i < itemDims.y; i++) {
                                lowest = Math.max(lowCol[(r + i)], lowest);
                            }

                            if (pos && (r + itemDims.y) > pos.row && r < (pos.row + dims.y)) {          //	If our element is in one of the item's rows
                                if ((c >= pos.col && c < (pos.col + dims.x)) ||                         //	If this col is occupied by our element
                                    ((itemDims.x > (pos.col - lowest)) &&                               //	Or the item can't fit above our element
                                    (c >= (pos.col + dims.x) && lowest < (pos.col + dims.x)))) {    //		And this col is below our element, but we haven't caught it
                                    lowest = Math.max(lowest, pos.col + dims.x);                        //	Set the lowest col to be below it
                                }
                            }

                            if (lowest != itemPos.col) {	//	If the item is not already on this col move it up
                                this._removeFromGrid(item);
                                item.setGridPosition(lowest, r);
                                item.onCascadeEvent();
                                this._addToGrid(item);
                            }

                            for (var i:number = 0; i < itemDims.y; i++) {
                                lowCol[r + i] = lowest + itemDims.x;	//	Update the lowest col to be below the item
                            }

                        }
                    }
                }
                break;
            default:
                break;
        }
    }

    private _fixGridPosition(pos:{ col:number, row:number }, dims:{ x:number, y:number }):{ col:number, row:number } {
        while (this._hasGridCollision(pos, dims) || !this._isWithinBounds(pos, dims)) {
            if (this._hasGridCollision(pos, dims)) {
                switch (this.cascade) {
                    case 'up':
                    case 'down':
                        pos.row++;
                        break;
                    case 'left':
                    case 'right':
                        pos.col++;
                        break;
                    default:
                        break;
                }
            }

            if (!this._isWithinBoundsY(pos, dims)) {
                pos.col++;
                pos.row = 1;
            }
            if (!this._isWithinBoundsX(pos, dims)) {
                pos.row++;
                pos.col = 1;
            }
        }
        return pos;
    }

    private _isWithinBoundsX(pos:{ col:number, row:number }, dims:{ x:number, y:number }) {
        return (this._maxCols == 0 || (pos.col + dims.x - 1) <= this._maxCols);
    }

    private _isWithinBoundsY(pos:{ col:number, row:number }, dims:{ x:number, y:number }) {
        return (this._maxRows == 0 || (pos.row + dims.y - 1) <= this._maxRows);
    }

    private _isWithinBounds(pos:{ col:number, row:number }, dims:{ x:number, y:number }) {
        return this._isWithinBoundsX(pos, dims) && this._isWithinBoundsY(pos, dims);
    }

    private _addToGrid(item:NgGridItem, pos:any = item.getGridPosition()):void {
        var dims = item.getSize();

        if (!this._hasGridCollision(pos, dims)) {
            const res = item.setGridPosition(pos.col, pos.row);
            if (!res) {
                pos = item.getGridPosition();
            }
        } else {
            pos = item.getGridPosition();
        }

        item.recalculateSelf();

        for (var j = 0; j < dims.y; j++) {
            if (this._itemGrid[pos.row + j] == null) this._itemGrid[pos.row + j] = {};
            for (var i = 0; i < dims.x; i++) {
                this._itemGrid[pos.row + j][pos.col + i] = item;

                this._updateSize(pos.col + dims.x - 1, pos.row + dims.y - 1);
            }
        }
    }

    private _removeFromGrid(item:NgGridItem):void {
        for (var y in this._itemGrid)
            for (var x in this._itemGrid[y])
                if (this._itemGrid[y][x] == item)
                    this._itemGrid[y][x] = null;
    }

    private setSize(width: string, height: string) {
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', width);
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', height);
    }

    private _updateSize(col?:number, row?:number):void {
        return;
        col = (col == undefined) ? 0 : col;
        row = (row == undefined) ? 0 : row;

        this._filterGrid();

        var maxRow = Math.max(this._getMaxRow(), row);
        // var maxCol = Math.max(this._getMaxCol(), col);

        this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', "100%");//(maxCol * (this.colWidth + this.marginLeft + this.marginRight))+"px");
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', (maxRow * (this.rowHeight + this.marginTop + this.marginBottom)) + "px");
    }

    private _filterGrid():void {
        var curMaxCol = this._getMaxCol();
        var curMaxRow = this._getMaxRow();
        var maxCol = 0;
        var maxRow = 0;

        for (var r:number = 1; r <= curMaxRow; r++) {
            if (this._itemGrid[r] == undefined) continue;

            for (var c:number = 1; c <= curMaxCol; c++) {
                if (this._itemGrid[r][c] != null) {
                    maxCol = Math.max(maxCol, c);
                    maxRow = Math.max(maxRow, r);
                }
            }
        }

        if (curMaxRow != maxRow)
            for (var r:number = maxRow + 1; r <= curMaxRow; r++)
                if (this._itemGrid[r] !== undefined)
                    delete this._itemGrid[r];

        if (curMaxCol != maxCol)
            for (var r:number = 1; r <= maxRow; r++) {
                if (this._itemGrid[r] == undefined) continue;

                for (var c:number = maxCol + 1; c <= curMaxCol; c++)
                    if (this._itemGrid[r][c] !== undefined)
                        delete this._itemGrid[r][c];
            }
    }

    private _getMaxRow():number {
        return Math.max.apply(null, Object.keys(this._itemGrid));
    }

    private _getMaxCol():number {
        const maxes = Object.keys(this._itemGrid).map(v => Math.max.apply(null, Object.keys(this._itemGrid[v])));
        return Math.max.apply(null, maxes);
    }

    private _getMousePosition(e:any):{ left:number, top:number } {
        if (((<any>window).TouchEvent && e instanceof TouchEvent) || (e.touches || e.changedTouches)) {
            e = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
        }
        var refPos = this._ngEl.nativeElement.getBoundingClientRect();

        var left = e.clientX - refPos.left;
        var top = e.clientY - refPos.top;

        if (this.cascade == "down") top = refPos.top + refPos.height - e.clientY;
        if (this.cascade == "right") left = refPos.left + refPos.width - e.clientX;

        return {
            left,
            top
        };
    }

    private _getItemFromPosition(position:{ left:number, top:number }):NgGridItem {
        const isPositionInside = (size:{width:number, height:number}, pos:{left:number, top:number}) => {
            return position.left > (pos.left + this.marginLeft) && position.left < (pos.left + this.marginLeft + size.width) &&
                position.top > (pos.top + this.marginTop) && position.top < (pos.top + this.marginTop + size.height)
        };

        return this._items.find(el => isPositionInside(el.getDimensions(), el.getPosition()));
    }

    public getItem(e:MouseEvent) {
        return this._getItemFromPosition(this._getMousePosition(e));
    }

    public getGridPositionOfEvent(event, offset) {
        let {left, top} = this._getMousePosition(event);
        return this._calculateGridPosition(left - offset.left, top - offset.top);
    }

    private initPlaceholder() {
        this.cmpResolver.resolveComponent(NgGridPlaceholder)
            .then((factory:ComponentFactory) => this.viewContainer.createComponent(factory))
            .then(componentRef => {
                this._placeholderRef = componentRef;
                this._placeholderRef.instance.registerGrid(this);
                this._placeholderRef.instance.setSize(0, 0);
            });
    }

    public _createPlaceholder(item:NgGridItem) {
        const pos = item.getGridPosition(), dims = item.getSize();
        this.cmpResolver.resolveComponent(NgGridPlaceholder)
            .then((factory:ComponentFactory) => {
                return item.containerRef.createComponent(factory, item.containerRef.length, item.containerRef.parentInjector);
            })
            .then(componentRef => {
                this._placeholderRef = componentRef;
                this._placeholderRef.instance.registerGrid(this);
                this._placeholderRef.instance.setGridPosition(pos.col, pos.row);
                this._placeholderRef.instance.setSize(dims.x, dims.y);
            });
    }

    private onDragOver(e:any) {
        e.preventDefault();
        return false;
    }

    public injectItem(component, element, componentData) {
        return this.cmpResolver.resolveComponent(component)
            .then((factory:ComponentFactory) => {
                    const ref:ComponentRef = factory.create(this.viewContainer.injector, undefined, element);
                    Object.assign(ref.instance, componentData);
                    this.appRef._loadComponent(ref);
            });
    }
}
