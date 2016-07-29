import {Injectable} from '@angular/core';
import {NgGridItemConfig} from "../components/ng-grid-item/NgGridItemConfig";
import {NgGridConfig} from "../components/ng-grid/NgGridConfig";

export interface ConditionFn {
    (gridX:number, gridY:number, gridItem:NgGridItemConfig, hoveredGrid:NgGridConfig):boolean;
}

@Injectable()
export class GridPositionService {
    private conditions:ConditionFn[] = [];

    addCondition(condition:ConditionFn) {
        this.conditions.push(condition);
    }

    validateGridPosition(gridX:number, gridY:number, gridItem:NgGridItemConfig, hoveredGrid:NgGridConfig):boolean {
        return this.conditions
            .map(condition => condition(gridX, gridY, gridItem, hoveredGrid))
            .reduce((a, b) => a && b, true);
    }
}