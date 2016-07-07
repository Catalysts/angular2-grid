import {
    Component,
    ElementRef,
    Renderer,
    OnInit,
} from '@angular/core';

import {NgGrid} from './NgGrid';
import {GridPositionService} from '../../service/GridPositionService';
import {NgGridItem} from "../ng-grid-item/NgGridItem";

@Component({
    selector: 'ngGridPlaceholder',
    template: `<div [style.display]="hidden"></div>`
})
export class NgGridPlaceholder implements OnInit {
    private hidden:boolean = true;
    private _sizex:number;
    private _sizey:number;
    private _col:number;
    private _row:number;
    private _ngGrid:NgGrid;

    constructor(private _ngEl:ElementRef,
                private _renderer:Renderer,
                private gridPositionService:GridPositionService) {
    }

    public registerGrid(ngGrid:NgGrid) {
        this._ngGrid = ngGrid;
    }

    public ngOnInit():void {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', true);
        /*if (this._ngGrid.autoStyle)*/ this._renderer.setElementStyle(this._ngEl.nativeElement, 'position', 'absolute');
    }

    public setSize(x:number, y:number):void {
        this._sizex = x;
        this._sizey = y;
        this._recalculateDimensions();
    }

    public setGridPosition(col:number, row:number, item:NgGridItem):void {
        // if (!this.gridPositionService.validateGridPosition(col, row, item)) {
        //     this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', true);
        //     this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', false);
        // } else {
        //     this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', false);
        //     this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', true);
        // }
        this._col = col;
        this._row = row;
        this._recalculatePosition();
    }

    public makeInvalid() {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', true);
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', false);
    }

    public makeValid() {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', false);
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', true);
    }

    private _setPosition(x:number, y:number):void {
        switch (this._ngGrid.cascade) {
            case 'up':
            case 'left':
            default:
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'transform', 'translate(' + x + 'px, ' + y + 'px)');
                this._renderer.setElementStyle(this._ngEl.nativeElement, 'left', x + "px");
                this._renderer.setElementStyle(this._ngEl.nativeElement, 'top', y + "px");
                this._renderer.setElementStyle(this._ngEl.nativeElement, 'right', null);
                this._renderer.setElementStyle(this._ngEl.nativeElement, 'bottom', null);
                break;
            case 'right':
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'transform', 'translate(' + -x + 'px, ' + y + 'px)');
                //
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'right', x + "px");
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'top', y + "px");
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'left', null);
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'bottom', null);
                break;
            case 'down':
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'transform', 'translate(' + x + 'px, ' + -y + 'px)');

                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'left', x + "px");
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'bottom', y + "px");
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'right', null);
                // this._renderer.setElementStyle(this._ngEl.nativeElement, 'top', null);
                break;
        }
    }

    private _setDimensions(w:number, h:number):void {
        w = w < 0 ? 0 : w;
        h = h < 0 ? 0 : h;
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', w + "px");
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', h + "px");
    }

    //	Private methods
    private _recalculatePosition():void {
        var x = this._ngGrid.pagePosition.pageX + (this._ngGrid.colWidth + this._ngGrid.marginLeft + this._ngGrid.marginRight) * (this._col - 1) + this._ngGrid.marginLeft;
        var y = this._ngGrid.pagePosition.pageY + (this._ngGrid.rowHeight + this._ngGrid.marginTop + this._ngGrid.marginBottom) * (this._row - 1) + this._ngGrid.marginTop;
        console.log(x, y);
        this._setPosition(x, y);
    }

    private _recalculateDimensions():void {
        var w = (this._ngGrid.colWidth * this._sizex) + ((this._ngGrid.marginLeft + this._ngGrid.marginRight) * (this._sizex - 1));
        var h = (this._ngGrid.rowHeight * this._sizey) + ((this._ngGrid.marginTop + this._ngGrid.marginBottom) * (this._sizey - 1));
        this._setDimensions(w, h);
    }

    public hide():void {
        this.hidden = true;
    }
}
