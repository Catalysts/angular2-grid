/**
 * Created by tudorgergely on 5/24/16.
 */
import {
    Component,
} from '@angular/core';

@Component({
    selector: 'ngGridWrapper',
    template: `
        <ngGrid config="config"></ngGrid>
    `,
})
export class NgGridWrapper {
    private config = {

    };
}