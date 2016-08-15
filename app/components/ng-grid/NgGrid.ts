import {
    Directive,
    ElementRef,
    Renderer,
    ComponentRef,
    OnInit,
    ViewContainerRef,
    ComponentFactoryResolver,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';

import {NgGridItem} from '../ng-grid-item/NgGridItem';
import {NgGridConfig, GridPosition, PageSize, PagePosition} from './NgGridTypes';
import {NgGridPlaceholder} from './NgGridPlaceholder';
import {NgGridItemConfig} from '../ng-grid-item/NgGridItemTypes';

@Directive({
    selector: '[ngGrid]'
})
export class NgGrid implements OnInit, OnChanges {
    @Input('ngGrid') config: NgGridConfig;

    items: NgGridItem[] = [];
    private placeholderConfig: NgGridItemConfig = {
        id: 'placeholder',
        col: 1,
        row: 1,
        colSpan: 0,
        rowSpan: 0,
        cellWidth: 50,
        cellHeight: 50,
        component: {
            type: NgGridPlaceholder,
            data: {}
        }
    };
    private placeholderRef: ComponentRef<NgGridItem>;

    constructor(private _ngEl: ElementRef,
                private _renderer: Renderer,
                private factoryResolver: ComponentFactoryResolver,
                private viewContainer: ViewContainerRef) {
    }

    ngOnInit(): void {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid', true);
        this.setConfig(this.config);
        this.createPlaceholder();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config']) {
            this.setConfig(this.config);
        }
    }

    setConfig(config: NgGridConfig): void {
        const width = config.cellWidth * config.columnsCount;
        const height = config.cellHeight * config.rowsCount;

        this.setSize(width, height);
    }

    getItemFromEvent(e: MouseEvent): NgGridItem {
        return this.getItemFromPosition(this.getMousePosition(e));
    }

    getGridPositionOfEvent(event: any, offset: any) {
        const {left, top} = this.getMousePosition(event);
        return this.calculateGridPosition(left - offset.left, top - offset.top);
    }

    hidePlaceholder(): void {
        this.placeholderConfig.colSpan = 0;
        this.placeholderConfig.rowSpan = 0;
    }

    changePlaceholderConfig(newPlaceholderConfig: NgGridItemConfig) {
        const {colSpan, rowSpan, cellWidth, cellHeight} = newPlaceholderConfig;
        this.placeholderConfig.colSpan = colSpan;
        this.placeholderConfig.rowSpan = rowSpan;
        this.placeholderConfig.cellWidth = cellWidth;
        this.placeholderConfig.cellHeight = cellHeight;
    }

    private calculateGridPosition(left: number, top: number): GridPosition {
        const {margins} = this.config;
        return {
            col: Math.max(1, Math.round(left / (this.config.cellWidth + margins.left + margins.right)) + 1),
            row: Math.max(1, Math.round(top / (this.config.cellHeight + margins.top + margins.bottom)) + 1)
        };
    }

    private setSize(width: number, height: number): void {
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', width + 'px');
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', height + 'px');
    }

    private getMousePosition(e: MouseEvent): PagePosition {
        const refPos = this._ngEl.nativeElement.getBoundingClientRect();

        return {
            left: e.clientX - refPos.left,
            top: e.clientY - refPos.top
        };
    }

    private getItemFromPosition(position: PagePosition): NgGridItem {
        const {margins} = this.config;
        const isPositionInside = (size: PageSize, pos: PagePosition) => {
            return position.left > (pos.left + margins.left) &&
                position.left < (pos.left + margins.left + size.width) &&
                position.top > (pos.top + margins.top) &&
                position.top < (pos.top + margins.top + size.height);
        };

        return this.items.find(el => isPositionInside(el.getPageSize(), el.getPagePosition()));
    }

    private createPlaceholder(): void {
        if (this.placeholderRef) {
            this.placeholderRef.destroy();
        }
        const factory = this.factoryResolver.resolveComponentFactory(<any>this.placeholderConfig.component.type);
        this.placeholderRef = this.viewContainer.createComponent(factory);
        Object.assign(this.placeholderRef.instance, this.placeholderConfig.component.data);
        this.placeholderRef.changeDetectorRef.detectChanges();
    }
}
