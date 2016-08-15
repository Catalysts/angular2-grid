import {Component, ViewEncapsulation, ViewChild, OnInit, NgModule} from '@angular/core';
import {CORE_DIRECTIVES, FORM_DIRECTIVES} from '@angular/common';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {
    NgGrid,
    NgGridConfig,
    NgGridComponent,
    NgGridItem,
    GridValidationService,
    NgGridItemConfig,
    NgGridDraggable,
    GridDragService,
} from './index';

import {TestComponent} from './TestComponent';
import {NgGridWrapper} from './NgGridWrapper';
import {NgGridPlaceholder} from './components/ng-grid/NgGridPlaceholder';

@Component({
    selector: 'my-app',
    // templateUrl: './app.html',
    template: `
        <ngGrid #grid1 [items]="items" [config]="gridConfig"></ngGrid>
        <div [ngGridDraggable]="draggable" style="width: 100px; height: 100px; background-color: red;"></div>
    `,
    // styleUrls: ['app.css', 'NgGrid.css', 'NgGrid_FixSmall.css'],
    providers: [GridValidationService, GridDragService],
    directives: [CORE_DIRECTIVES, NgGrid, NgGridItem, FORM_DIRECTIVES, NgGridDraggable, NgGridComponent, TestComponent],
    encapsulation: ViewEncapsulation.None
})
class MyAppComponent implements OnInit {
    @ViewChild('grid1')
    ngGrid1: NgGrid;
    @ViewChild('grid2')
    ngGrid2: NgGrid;

    gridConfig: NgGridConfig = {
        draggable: true,
        resizable: false,
        columnsCount: 16,
        rowsCount: 30,
        margins: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        },
        cellWidth: 50,
        cellHeight: 50,
    };
    items: NgGridItemConfig[] = [
        {
            id: '1',
            col: 1,
            row: 1,
            colSpan: 3,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            fixed: false,
            component: {
                type: TestComponent,
                data: {
                    name: 'tudor',
                    id: '1',
                }
            },
        },
        {
            id: '2',
            col: 9,
            row: 1,
            colSpan: 3,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            component: {
                type: TestComponent,
                data: {
                    id: '2',
                }
            },
        },
        {
            id: '4',
            col: 1,
            row: 4,
            colSpan: 16,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            fixed: true,
            component: {
                type: TestComponent,
                data: {
                    id: '4',
                }
            },
        },
        {
            id: '5',
            col: 1,
            row: 6,
            colSpan: 3,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            fixed: true,
            component: {
                type: TestComponent,
                data: {
                    id: '5',
                }
            },
        },
        {
            id: '6',
            col: 9,
            row: 6,
            colSpan: 3,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            component: {
                type: TestComponent,
                data: {
                    id: '6',
                }
            },
        },
        {
            id: '8',
            col: 1,
            row: 12,
            colSpan: 16,
            rowSpan: 2,
            cellHeight: 50,
            cellWidth: 50,
            component: {
                type: TestComponent,
                data: {
                    id: '8',
                }
            },
        },
    ];
    draggable: NgGridItemConfig = {
        id: '23',
        col: 9,
        row: 9,
        colSpan: 12,
        rowSpan: 8,
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

    private static validatePosition(gridCol: number, gridRow: number): boolean {
        return gridCol % 8 === 1;
    }

    constructor(private gridPositionService: GridValidationService, private gridDragService: GridDragService) {
        this.gridPositionService.addPositionCondition(MyAppComponent.validatePosition);
    }

    ngOnInit() {
    }
}

@NgModule({
    imports: [BrowserModule],
    declarations: [MyAppComponent, NgGridPlaceholder, TestComponent],
    entryComponents: [NgGridPlaceholder, TestComponent],
    bootstrap: [MyAppComponent]
})
export class AppModule {
}

platformBrowserDynamic().bootstrapModule(AppModule);
