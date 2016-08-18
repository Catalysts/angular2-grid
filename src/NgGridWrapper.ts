/**
 * Created by tudorgergely on 5/24/16.
 */
import {
    Component, Input,
} from '@angular/core';
import {NgGridComponent} from "./components/ng-grid/NgGridComponent";

@Component({
    selector: 'ngGridWrapper',
    directives: [
        NgGridComponent
    ],
    template: `
        <ngGrid [config]="config" [items]="items"></ngGrid>
    `,
})
export class NgGridWrapper {
    @Input()
    public items;
    @Input()
    public config;
}