import {Component, ViewEncapsulation, enableProdMode, provide, ViewChild, OnInit} from '@angular/core';
import {CORE_DIRECTIVES, FORM_DIRECTIVES} from '@angular/common';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {
    NgGrid,
    NgGridConfig,
    NgGridComponent,
    NgGridItem,
    GridPositionService,
    NgGridItemConfig,
    NgGridDraggable,
    GridDragService,
} from './index';

import {TestComponent} from './TestComponent';
import {NgGridWrapper} from "./NgGridWrapper";

@Component({
    selector: 'my-app',
    templateUrl: 'app.html',
    styleUrls: ['app.css', 'NgGrid.css', 'NgGrid_FixSmall.css'],
    providers: [GridPositionService, GridDragService],
    directives: [CORE_DIRECTIVES, NgGrid, NgGridItem, FORM_DIRECTIVES, NgGridDraggable, NgGridComponent, TestComponent],
    encapsulation: ViewEncapsulation.None
})
class MyAppComponent extends OnInit {
    @ViewChild('grid1')
    private ngGrid1:NgGrid;
    @ViewChild('grid2')
    private ngGrid2:NgGrid;

    private gridConfig = <NgGridConfig>{
        'margins': [5],
        'draggable': true,
        'resizable': false,
        'maxCols': 16,
        'maxRows': 30,
        'visibleCols': 0,
        'visibleRows': 0,
        'minCols': 1,
        'minRows': 1,
        'colWidth': 50,
        'rowHeight': 50,
        'cascade': 'off',
        'minWidth': 50,
        'minHeight': 50,
        'fixToGrid': false,
        'autoStyle': true,
        'autoResize': false,
        'maintainRatio': false,
        'preferNew': true,
        'width': 1000,
        'height': 1000,
    };
    private items:NgGridItemConfig[] = [
        {
            col: 1,
            row: 1,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {name: 'tudor'}},
        },
        {
            col: 9,
            row: 1,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {}},
        },
        {
            col: 1,
            row: 4,
            sizex: 16,
            sizey: 2,
            draggable: false,
            component: {type: TestComponent, data: {}},
        },
        {
            col: 1,
            row: 6,
            sizex: 8,
            sizey: 3,
            draggable: false,
            component: {type: TestComponent, data: {}},
        },
        {
            col: 9,
            row: 6,
            sizex: 8,
            sizey: 6,
            component: {type: TestComponent, data: {}},
        },
        {
            col: 1,
            row: 12,
            sizex: 16,
            sizey: 2,
            component: {type: TestComponent, data: {}},
        },
    ];
    private items2:NgGridItemConfig[] = [
        {
            col: 1,
            row: 1,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {}},
        }, {
            col: 1,
            row: 4,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {}},
        }, {
            col: 9,
            row: 1,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {}},
        }, {
            col: 1,
            row: 6,
            sizex: 8,
            sizey: 3,
            component: {type: TestComponent, data: {}},
        },
    ];
    private draggable:NgGridItemConfig = {
        col: 9,
        row: 9,
        sizex: 8,
        sizey: 3,
        component: {
            type: NgGridWrapper,
            data: {}
        }
    };

    constructor(private gridPositionService:GridPositionService, private gridDragService:GridDragService) {
        this.gridPositionService.addCondition(this.validatePosition);
    }

    ngOnInit() {
    }

    private validatePosition(gridCol:number, gridRow:number):boolean {
        return gridCol % 8 == 1;
    }
}

enableProdMode();
bootstrap(MyAppComponent, [provide(Window, {useValue: window})]);