/**
 * Created by tudorgergely on 5/24/16.
 */
import {
    Component,
} from '@angular/core';
import {NgGridComponent} from "./components/ng-grid/NgGridComponent";

@Component({
    selector: 'ngGridWrapper',
    inputs: [
        'items: items',
        'config: config',
    ],
    directives: [
        NgGridComponent
    ],
    template: `
        <ngGrid [config]="config" [items]="items"></ngGrid>
    `,
})
export class NgGridWrapper {
    public items, config;
}