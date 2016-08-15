import {Injectable} from '@angular/core';
import {NgGridItemConfig} from '../components/ng-grid-item/NgGridItemTypes';
import {NgGridConfig} from '../components/ng-grid/NgGridTypes';

export interface ConditionFn {
    (gridX: number, gridY: number, gridItem: NgGridItemConfig, hoveredGrid: NgGridConfig): boolean;
}

@Injectable()
export class GridValidationService {
    private positionConditions: ConditionFn[] = [];
    private resizeConditions: ConditionFn[] = [];

    addPositionCondition(condition: ConditionFn) {
        this.positionConditions.push(condition);
    }

    addResizeCondition(condition: ConditionFn) {
        this.resizeConditions.push(condition);
    }

    validateConditions(gridX: number,
                       gridY: number,
                       gridItem: NgGridItemConfig,
                       hoveredGrid: NgGridConfig,
                       conditions: ConditionFn[]): boolean {
        return conditions
            .map(condition => condition(gridX, gridY, gridItem, hoveredGrid))
            .reduce((a, b) => a && b, true);
    }

    validateGridPosition(gridX: number,
                         gridY: number,
                         gridItem: NgGridItemConfig,
                         hoveredGrid: NgGridConfig): boolean {
        return this.validateConditions(gridX, gridY, gridItem, hoveredGrid, this.positionConditions);
    }

    validateResize(gridX: number,
                   gridY: number,
                   gridItem: NgGridItemConfig,
                   hoveredGrid: NgGridConfig): boolean {
        return this.validateConditions(gridX, gridY, gridItem, hoveredGrid, this.resizeConditions);
    }
}