export interface NgGridItemConfig {
    id?: string;
    col?: number;
    row?: number;
    sizex?: number;
    sizey?: number;
    dragHandle?: string;
    resizeHandle?: string;
    fixed?: boolean;
    draggable?: boolean;
    resizable?: boolean;
    borderSize?: number;
    component?: any;
}