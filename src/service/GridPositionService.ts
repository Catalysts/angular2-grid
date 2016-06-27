import {Injectable} from '@angular/core';
import {NgGridItem} from '../components/ng-grid-item/NgGridItem';

export interface ConditionFn {
    (gridX: number, gridY: number, gridItem: NgGridItem): boolean;
}

@Injectable()
export class GridPositionService {
    private conditions: ConditionFn[] = [];

    addCondition(condition: ConditionFn) {
        this.conditions.push(condition);
    }

    validateGridPosition(gridX: number, gridY: number, gridItem: NgGridItem): boolean {
        return this.conditions
            .map(condition => condition(gridX, gridY, gridItem))
            .reduce((a, b) => a && b, true);
    }
}