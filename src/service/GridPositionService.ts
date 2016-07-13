import {Injectable} from '@angular/core';
import {NgGridItemConfig} from "../components/ng-grid-item/NgGridItemConfig";

export interface ConditionFn {
    (gridX: number, gridY: number, gridItem: NgGridItemConfig): boolean;
}

@Injectable()
export class GridPositionService {
    private conditions: ConditionFn[] = [];

    addCondition(condition: ConditionFn) {
        this.conditions.push(condition);
    }

    validateGridPosition(gridX: number, gridY: number, gridItem: NgGridItemConfig): boolean {
        return this.conditions
            .map(condition => condition(gridX, gridY, gridItem))
            .reduce((a, b) => a && b, true);
    }
}