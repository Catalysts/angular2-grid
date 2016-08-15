import {Type} from '@angular/core';
import {UUID} from 'angular2-uuid';

export interface NgGridItemConfig {
    id: string;
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    cellWidth: number;
    cellHeight: number;
    fixed?: boolean;
    resizable?: boolean;
    component?: NgGridItemComponent;
}

export interface NgGridItemComponent {
    type: Type;
    data: any;
}

export const ITEM_DEFAULT_CONFIG: NgGridItemConfig = {
    id: UUID.UUID(),
    col: 1,
    row: 1,
    colSpan: 1,
    rowSpan: 1,
    cellWidth: 1,
    cellHeight: 1,
    fixed: false,
    resizable: true
};
