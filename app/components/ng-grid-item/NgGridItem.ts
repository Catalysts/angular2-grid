import {
    ElementRef,
    Renderer,
    EventEmitter,
    OnInit,
    OnDestroy,
    ViewContainerRef,
    Output,
    Input,
    HostListener,
    ComponentFactoryResolver,
    ComponentRef,
    Component,
    ViewChild,
    OnChanges,
    SimpleChanges,
    AfterViewInit
} from '@angular/core';
import {NgGridItemConfig, ITEM_DEFAULT_CONFIG} from './NgGridItemTypes';
import {PagePosition, GridPosition, PageSize, GridItemSize} from '../ng-grid/NgGridTypes';

@Component({
    selector: '[ngGridItem]',
    template: `
        <div #componentContainer></div>
    `
})
export class NgGridItem implements OnInit, OnDestroy, OnChanges, AfterViewInit {
    @Output() ngGridItemChange: EventEmitter<NgGridItemConfig> = new EventEmitter<NgGridItemConfig>();

    @Input('ngGridItem') config: NgGridItemConfig;
    @ViewChild('componentContainer', {read: ViewContainerRef}) private componentContainer: ViewContainerRef;

    private componentRef: ComponentRef<NgGridItem>;
    private isResizing: boolean = false;

    constructor(private elementRef: ElementRef,
                private renderer: Renderer,
                private factoryResolver: ComponentFactoryResolver) {
    }

    ngOnInit(): void {
        this.renderer.setElementClass(this.elementRef.nativeElement, 'grid-item', true);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config']) {
            const v = Object.assign({}, ITEM_DEFAULT_CONFIG, this.config);

            this.setConfig(v);
        }
    }

    ngOnDestroy(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
    }

    ngAfterViewInit(): void {
        this.injectComponent();
    }

    canDrag(): boolean {
        const {fixed} = this.config;
        return !fixed;
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(e: MouseEvent): void {
        const mousePos = this.getMousePosition(e);
        const {width, height} = this.getPageSize();
        if (this.isResizing) {
            this.setDimensions(width + e.offsetX, height);
        } else if (this.canResize(e)) {
            this.setResizeCursorStyle(mousePos);
        } else {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'auto');
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(e: MouseEvent): void {
        if (this.canResize(e)) {
            this.isResizing = true;
            // e.preventDefault();
            // e.stopPropagation();
        } else {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'auto');
        }
    }

    @HostListener('window:mouseup')
    onMouseUp(): void {
        this.isResizing = false;
    }

    canResize(e: any): boolean {
        const {resizable} = this.config;
        return resizable;
    }

    getPageSize(): PageSize {
        const {cellWidth, cellHeight, colSpan, rowSpan} = this.config;
        return {
            width: cellHeight * rowSpan,
            height: cellWidth * colSpan
        };
    }

    getPagePosition(): PagePosition {
        return {
            left: this.elementRef.nativeElement.getBoundingClientRect().left,
            top: this.elementRef.nativeElement.getBoundingClientRect().top + window.scrollY
        };
    }

    getGridSize(): GridItemSize {
        const {colSpan, rowSpan} = this.config;
        return {colSpan, rowSpan};
    }

    getGridPosition(): GridPosition {
        const {col, row} = this.config;
        return {col, row};
    }

    move(event: MouseEvent, offset: any) {
        let parentTop = this.elementRef.nativeElement.parentElement.getBoundingClientRect().top;
        parentTop += window.scrollY;

        let parentLeft = this.elementRef.nativeElement.parentElement.getBoundingClientRect().left;
        parentLeft += window.scrollX;

        const left = event.pageX - offset.left - parentLeft;
        const top = event.pageY - offset.top - parentTop;

        this.setPosition(left, top);
    }

    startMoving(): void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
    }

    stopMoving(): void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'auto');
    }

    private setConfig(config: NgGridItemConfig): void {
        const {col, row, cellWidth, cellHeight} = config;
        this.setPosition((col - 1) * cellWidth, (row - 1) * cellHeight);

        const {colSpan, rowSpan} = config;
        this.setDimensions(cellWidth * colSpan, cellHeight * rowSpan);
    }

    private setPosition(x: number, y: number): void {
        this.elementRef.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    private setDimensions(w: number, h: number): void {
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'width', w + 'px');
        this.renderer.setElementStyle(this.elementRef.nativeElement, 'height', h + 'px');
    }

    private setResizeCursorStyle(mousePosition: any) {
        const {width, height} = this.getPageSize();
        if (mousePosition.left < width && mousePosition.left > width
            && mousePosition.top < height && mousePosition.top > height) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'nwse-resize');
        } else if (mousePosition.left < width && mousePosition.left > width) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'ew-resize');
        } else if (mousePosition.top < height && mousePosition.top > height) {
            this.renderer.setElementStyle(this.elementRef.nativeElement, 'cursor', 'ns-resize');
        }
    }

    private injectComponent(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
        const factory = this.factoryResolver.resolveComponentFactory(<any>this.config.component.type);
        this.componentRef = this.componentContainer.createComponent(factory);
        Object.assign(this.componentRef.instance, this.config.component.data);
        this.componentRef.changeDetectorRef.detectChanges();
    }

    private getMousePosition(e: any): PagePosition {
        const refPos = this.elementRef.nativeElement.getBoundingClientRect();

        return {
            left: e.clientX - refPos.left,
            top: e.clientY - refPos.top
        };
    }
}
