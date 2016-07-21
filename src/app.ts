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
import {UUID} from "angular2-uuid/index";

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
        'id': UUID.UUID(),
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
    };
    private items:NgGridItemConfig[] = [
        {
            id: '1',
            col: 1,
            row: 1,
            sizex: 3,
            sizey: 2,
            component: {
                type: TestComponent, data: {
                    name: 'tudor',
                    id: '1',
                }
            },
        },
        {
            id: '2',
            col: 9,
            row: 1,
            sizex: 3,
            sizey: 2,
            component: {
                type: TestComponent, data: {
                    id: '2',
                }
            },
        },
        {
            id: '4',
            col: 1,
            row: 4,
            sizex: 16,
            sizey: 2,
            draggable: false,
            component: {
                type: TestComponent, data: {
                    id: '4',
                }
            },
        },
        {
            id: '5',
            col: 1,
            row: 6,
            sizex: 3,
            sizey: 2,
            draggable: false,
            component: {
                type: TestComponent, data: {
                    id: '5',
                }
            },
        },
        {
            id: '6',
            col: 9,
            row: 6,
            sizex: 3,
            sizey: 2,
            component: {
                type: TestComponent, data: {
                    id: '6',
                }
            },
        },
        {
            id: '8',
            col: 1,
            row: 12,
            sizex: 16,
            sizey: 2,
            component: {
                type: TestComponent, data: {
                    id: '8',
                }
            },
        },
    ];
    private draggable:NgGridItemConfig = {
        id: '23',
        col: 9,
        row: 9,
        sizex: 12,
        sizey: 8,
        component: {
            type: NgGridWrapper,
            data: {
                config: {
                    'id': '23',
                    'margins': [5],
                    'draggable': true,
                    'resizable': false,
                    'maxCols': 10,
                    'maxRows': 10,
                    'visibleCols': 0,
                    'visibleRows': 0,
                    'minCols': 1,
                    'minRows': 1,
                    'colWidth': 20,
                    'rowHeight': 20,
                    'cascade': 'off',
                    // 'minWidth': 50,
                    // 'minHeight': 50,
                    'fixToGrid': false,
                    'autoStyle': true,
                    'autoResize': false,
                    'maintainRatio': false,
                    'preferNew': true,
                },
                items: [],
            }
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
bootstrap(MyAppComponent);