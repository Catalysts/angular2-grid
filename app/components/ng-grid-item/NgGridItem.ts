import {
    Directive,
    ElementRef,
    Renderer,
    EventEmitter,
    KeyValueDiffer,
    KeyValueDiffers,
    OnInit,
    OnDestroy,
    ViewContainerRef,
    Output, Input, Host, HostListener, ComponentResolver, ComponentFactory, ComponentRef, Component,
    ViewChild, AfterViewInit
} from '@angular/core';
import {NgGridItemEvent} from './NgGridItemEvent';
import {NgGridItemConfig, ITEM_DEFAULT_CONFIG} from './NgGridItemConfig';
import {NgGrid} from '../ng-grid/NgGrid';
import {BehaviorSubject, ReplaySubject} from "rxjs/Rx";

@Component({
    selector: '[ngGridItem]',
    template: `
        <div #componentContainer></div>
    `
})
export class NgGridItem implements OnInit, OnDestroy, AfterViewInit {
    @Output()
    public onItemChange:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>(false);
    @Output()
    public onDragStart:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onDrag:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onDragStop:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onDragAny:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onResizeStart:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onResize:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onResizeStop:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onResizeAny:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onChangeStart:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onChange:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onChangeStop:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public onChangeAny:EventEmitter<NgGridItemEvent> = new EventEmitter<NgGridItemEvent>();
    @Output()
    public ngGridItemChange:EventEmitter<NgGridItemConfig> = new EventEmitter<NgGridItemConfig>();

    @ViewChild('componentContainer', {read: ViewContainerRef})
    private componentContainer:ViewContainerRef;

    private componentRef:ComponentRef<NgGridItem>;

    public isFixed:boolean = false;
    public isDraggable:boolean = true;
    public isResizable:boolean = true;

    private _col:number = 1;
    private _row:number = 1;
    private _sizex:number = 1;
    private _sizey:number = 1;
    private _config:NgGridItemConfig = ITEM_DEFAULT_CONFIG;
    private _dragHandle:string;
    private _resizeHandle:string;
    private _borderSize:number;
    private _elemWidth:number;
    private _elemHeight:number;
    private _elemLeft:number;
    private _elemTop:number;
    private _added:boolean = false;
    private _differ:KeyValueDiffer;

    private isResizing:boolean = false;

    // private mouseMove$:ReplaySubject = new ReplaySubject<any>();
    // private mouseDown$:ReplaySubject = new ReplaySubject<any>();
    // private resize$:ReplaySubject = new ReplaySubject<any>();

    constructor(private differs:KeyValueDiffers,
                private elementRef:ElementRef,
                private renderer:Renderer,
                private componentResolver:ComponentResolver,
                public _ngGrid:NgGrid,
                public containerRef:ViewContainerRef) {
    }

    @Input('ngGridItem')
    set config(v:NgGridItemConfig) {
        v = Object.assign({}, ITEM_DEFAULT_CONFIG, v);

        this.setConfig(v);

        if (this._differ == null && v != null) {
            this._differ = this.differs.find(this._config).create(null);
        }

        if (!this._added) {
            this._added = true;
            this._ngGrid.addItem(this);
        }

        this.recalculateSelf();
    }

    get config():NgGridItemConfig {
        return this._config;
    }

    public ngOnInit():void {
        this.renderer.setElementClass(this.elementRef.nativeElement, 'grid-item', true);
        if (this._ngGrid.autoStyle) this.renderer.setElementStyle(this.elementRef.nativeElement, 'position', 'absolute');
        this.recalculateSelf();

        if (!this._added) {

            this._added = true;
            this._ngGrid.addItem(this);
        }
    }

    public ngOnDestroy():void {
        if (this._added) this._ngGrid.removeItem(this);
        if (this.componentRef) {
            this.componentRef.destroy();
        }
    }

    public ngAfterViewInit():void {
        this.injectComponent();
    }

    public canDrag(e:any):boolean {
        if (!this.isDraggable) return false;

        if (this._dragHandle) {
            var parent = e.target.parentElement;

            return parent.querySelector(this._dragHandle) == e.target;
        }

        return true;
    }

    public canResize(e:any):string {
        if (!this.isResizable) return null;

        if (this._resizeHandle) {
            var parent = e.target.parentElement;

            return parent.querySelector(this._resizeHandle) == e.target ? 'both' : null;
        }

        var mousePos = this._getMousePosition(e);

        if (mousePos.left < this._elemWidth && mousePos.left > this._elemWidth - this._borderSize
            && mousePos.top < this._elemHeight && mousePos.top > this._elemHeight - this._borderSize) {
            return 'both';
        } else if (mousePos.left < this._elemWidth && mousePos.left > this._elemWidth - this._borderSize) {
            return 'width';
        } else if (mousePos.top < this._elemHeight && mousePos.top > this._elemHeight - this._borderSize) {
            return 'height';
        }

        return null;
    }

    @HostListener('mousemove', ['$event'])
    public onMouseMove(e:MouseEvent):void {
        var mousePos = this._getMousePosition(e);

        if (this.isResizing) {
            console.log(e);
            this.setDimensions(this._elemWidth + e.offsetX, this._elemHeight);
        } else if (this.canResize(e)) {
            this.setResizeCursorStyle(mousePos);
        } else {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'auto');
        }
    }

    @HostListener('mousedown', ['$event'])
    private onMouseDown(e:MouseEvent):boolean {
        if (this.canResize(e)) {
            this.isResizing = true;
            e.preventDefault();
            e.stopPropagation();
            return true;
        } else {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'auto');
        }
    }

    @HostListener('window:mouseup')
    private onMouseUp() {
        this.isResizing = false;
    }

    private setResizeCursorStyle(mousePosition:any) {
        if (mousePosition.left < this._elemWidth && mousePosition.left > this._elemWidth - this._borderSize
            && mousePosition.top < this._elemHeight && mousePosition.top > this._elemHeight - this._borderSize) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'nwse-resize');
        } else if (mousePosition.left < this._elemWidth && mousePosition.left > this._elemWidth - this._borderSize) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'ew-resize');
        } else if (mousePosition.top < this._elemHeight && mousePosition.top > this._elemHeight - this._borderSize) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'ns-resize');
        }
    }

    public getDimensions():{ width:number, height:number } {
        return {'width': this._elemWidth, 'height': this._elemHeight}
    }

    public getSize():{ x:number, y:number } {
        return {'x': this._sizex, 'y': this._sizey}
    }

    public getPosition():{ left:number, top:number } {
        return {'left': this._elemLeft, 'top': this._elemTop}
    }

    public getPagePosition() {
        return {
            left: this.elementRef.nativeElement.getBoundingClientRect().left,
            top: this.elementRef.nativeElement.getBoundingClientRect().top + window.scrollY
        };
    }

    public getGridPosition():{ col:number, row:number } {
        return {'col': this._col, 'row': this._row}
    }

    public setConfig(config:NgGridItemConfig):void {
        this._config = config;

        this._col = config.col || ITEM_DEFAULT_CONFIG.col;
        this._row = config.row || ITEM_DEFAULT_CONFIG.row;
        this._sizex = config.sizex || ITEM_DEFAULT_CONFIG.sizex;
        this._sizey = config.sizey || ITEM_DEFAULT_CONFIG.sizey;
        this._dragHandle = config.dragHandle;
        this._resizeHandle = config.resizeHandle;
        this._borderSize = config.borderSize;
        this.isDraggable = !!config.draggable;
        this.isResizable = !!config.resizable;
        this.isFixed = !!config.fixed;
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

    public setSize(x:number, y:number, update:boolean = true):void {
        this._sizex = x;
        this._sizey = y;
        if (update) this._recalculateDimensions();

        this.onItemChange.emit(this.getEventOutput());
    }

    public setGridPosition(col:number, row:number, update:boolean = true):void {
        this._col = col;
        this._row = row;
        if (update) this._recalculateDimensions();

        this.onItemChange.emit(this.getEventOutput());
    }

    public getEventOutput():NgGridItemEvent {
        return {
            col: this._col,
            row: this._row,
            sizex: this._sizex,
            sizey: this._sizey,
            width: this._elemWidth,
            height: this._elemHeight,
            left: this._elemLeft,
            top: this._elemTop
        };
    }

    public move(event:MouseEvent, offset:any) {
        let parentTop = this.elementRef.nativeElement.parentElement.getBoundingClientRect().top;
        parentTop += window.scrollY;

        let parentLeft = this.elementRef.nativeElement.parentElement.getBoundingClientRect().left;
        parentLeft += window.scrollX;

        let left = event.pageX - offset.left - parentLeft;
        let top = event.pageY - offset.top - parentTop;

        this.setPosition(left, top);
    }

    public setPosition(x:number, y:number):void {
        this.elementRef.nativeElement.style.transform = `translate(${x}px, ${y}px)`;

        this._elemLeft = x;
        this._elemTop = y;
    }

    public setDimensions(w:number, h:number):void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'width', w + "px");
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'height', h + "px");
        this._elemWidth = w;
        this._elemHeight = h;
    }

    public startMoving():void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
    }

    public stopMoving():void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'auto');
    }

    public recalculateSelf():void {
        this._recalculatePosition();
        this._recalculateDimensions();
    }

    private _recalculatePosition():void {
        var x = (Math.max(this._ngGrid.minWidth, this._ngGrid.colWidth) + this._ngGrid.marginLeft + this._ngGrid.marginRight) * (this._col - 1) + this._ngGrid.marginLeft;
        var y = (Math.max(this._ngGrid.minHeight, this._ngGrid.rowHeight) + this._ngGrid.marginTop + this._ngGrid.marginBottom) * (this._row - 1) + this._ngGrid.marginTop;

        this.setPosition(x, y);
    }

    private _recalculateDimensions():void {
        var newWidth = Math.max(this._ngGrid.minWidth, this._ngGrid.colWidth) * this._sizex;
        var newHeight = Math.max(this._ngGrid.minHeight, this._ngGrid.rowHeight) * this._sizey;

        var w = newWidth + ((this._ngGrid.marginLeft + this._ngGrid.marginRight) * (this._sizex - 1));
        var h = newHeight + ((this._ngGrid.marginTop + this._ngGrid.marginBottom) * (this._sizey - 1));

        this.setDimensions(w, h);
    }

    private injectComponent():void {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
        this.componentResolver.resolveComponent(this._config.component.type)
            .then((factory:ComponentFactory<NgGridItem>) => {
                this.componentRef = this.componentContainer.createComponent(factory);
                Object.assign(this.componentRef.instance, this._config.component.data);
            });
    }

    private _getMousePosition(e:any):{ left:number, top:number } {
        if (e.originalEvent && e.originalEvent.touches) {
            var oe = e.originalEvent;
            e = oe.touches.length ? oe.touches[0] : oe.changedTouches[0];
        }

        var refPos = this.elementRef.nativeElement.getBoundingClientRect();

        return {
            left: e.clientX - refPos.left,
            top: e.clientY - refPos.top
        }
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
}