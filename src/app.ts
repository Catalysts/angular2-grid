import { Component, ViewEncapsulation, enableProdMode } from '@angular/core';
import { CORE_DIRECTIVES, FORM_DIRECTIVES } from '@angular/common';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { NgGrid, NgGridConfig, NgGridItem, GridPositionService, NgGridItemConfig } from './NgGrid';

export interface ItemWithText {
    text: string,
    config: NgGridItemConfig,
}

// Annotation section
@Component({
	selector: 'my-app',
	templateUrl: 'app.html',
	styleUrls: ['app.css', 'NgGrid.css', 'NgGrid_FixSmall.css'],
    providers: [GridPositionService],
	directives: [CORE_DIRECTIVES, NgGrid, NgGridItem, FORM_DIRECTIVES],
	encapsulation: ViewEncapsulation.None
})
// Component controller
class MyAppComponent {
	private gridConfig = <NgGridConfig>{
		'margins': [5],
		'draggable': true,
		'resizable': false,
		'max_cols': 16,
		'max_rows': 30,
		'visible_cols': 0,
		'visible_rows': 0,
		'min_cols': 1,
		'min_rows': 1,
		'col_width': 50,
		'row_height': 50,
		'cascade': 'off',
		'min_width': 50,
		'min_height': 50,
		'fix_to_grid': false,
		'auto_style': true,
		'auto_resize': false,
		'maintain_ratio': false,
		'prefer_new': false
	};
    private items: ItemWithText[] = [
        {
            text: '8x3',
            config: {
                col: 0,
                row: 0,
                sizex: 8,
                sizey: 3,
            },
        },
        {
            text: '8x3',
            config: {
                col: 9,
                row: 0,
                sizex: 8,
                sizey: 3,
            },
        },
        {
            text: '16x2 fixed',
            config: {
                col: 0,
                row: 4,
                sizex: 16,
                sizey: 2,
                fixed: true,
                draggable: false,
            },
        },
        {
            text: '8x3 fixed',
            config: {
                col: 0,
                row: 6,
                sizex: 8,
                sizey: 3,
                fixed: true,
                draggable: false,
            },
        },
        {
            text: '8x6',
            config: {
                col: 9,
                row: 6,
                sizex: 8,
                sizey: 6,
            },
        },
        {
            text: '16x2',
            config: {
                col: 0,
                row: 12,
                sizex: 16,
                sizey: 2,
            },
        },
    ];
	
	constructor(private gridPositionService: GridPositionService) {
        this.gridPositionService.addCondition(this.validatePosition);
	}
	
	private _generateDefaultItemConfig(): any {
		return { 'dragHandle': '.handle', 'col': 0, 'row': 0, 'sizex': 1, 'sizey': 1 };
	}

    private validatePosition(gridCol: number, gridRow: number): boolean {
        return gridCol % 8 == 1;
    }
}

enableProdMode();
bootstrap(MyAppComponent);