import {
    Component,
    ElementRef,
    Renderer,
    OnInit,
} from '@angular/core';

@Component({
    selector: 'ngGridPlaceholder',
    template: `<div [style.display]="hidden"></div>`
})
export class NgGridPlaceholder implements OnInit {
    private hidden: boolean = true;

    constructor(private _ngEl: ElementRef,
                private _renderer: Renderer) {
    }

    public ngOnInit(): void {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', true);
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'position', 'absolute');
        this._renderer.setElementStyle(this._ngEl.nativeElement, 'pointer-events', 'none');
    }

    public makeInvalid() {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', true);
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', false);
    }

    public makeValid() {
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder-invalid', false);
        this._renderer.setElementClass(this._ngEl.nativeElement, 'grid-placeholder', true);
    }

    public hide(): void {
        this.hidden = true;
    }
}
