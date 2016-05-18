import {Injectable} from '@angular/core'

export interface ConditionFn {
    (gridX: number, gridY: number): boolean;
}

@Injectable()
export class GridPositionService {
    private conditions: ConditionFn[] = [];

    addCondition(condition: ConditionFn) {
        this.conditions.push(condition);
    }

    validateGridPosition(gridX: number, gridY: number): boolean {
        return this.conditions
            .map(condition => condition(gridX, gridY))
            .reduce((a, b) => a && b, true);
    }
}