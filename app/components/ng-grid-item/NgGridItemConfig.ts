export interface NgGridItemConfig {
    id?:string;
    col?:number;
    row?:number;
    sizex?:number;
    sizey?:number;
    dragHandle?:string;
    resizeHandle?:string;
    fixed?:boolean;
    draggable?:boolean;
    resizable?:boolean;
    borderSize?:number;
    component?:any;
}

export const ITEM_DEFAULT_CONFIG:NgGridItemConfig = {
    col: 1,
    row: 1,
    sizex: 1,
    sizey: 1,
    fixed: false,
    draggable: true,
    resizable: true,
    borderSize: 15,
};