export interface NgGridConfig {
    margins?: GridMargins;
    draggable?: boolean;
    resizable?: boolean;
    cellWidth?: number;
    cellHeight?: number;
    rowsCount?: number;
    columnsCount?: number;
}

export interface PageSize {
    width: number;
    height: number;
}

export interface GridPosition {
    col: number;
    row: number;
}

export interface GridMargins {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

export interface GridItemSize {
    colSpan: number;
    rowSpan: number;
}

export interface PagePosition {
    left: number;
    top: number;
}
