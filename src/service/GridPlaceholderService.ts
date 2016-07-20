import {Injectable, ComponentFactory, OnInit, ComponentResolver, ViewContainerRef, ComponentRef} from "@angular/core";
import {NgGridItem} from "../components/ng-grid-item/NgGridItem";
import {NgGridPlaceholder} from "../components/ng-grid/NgGridPlaceholder";

@Injectable()
class GridPlaceholderService implements OnInit {
    private placeholder:NgGridPlaceholder;

    constructor(private window:Window, private cmpResolver:ComponentResolver) {
    }

    public showPlaceholder(item:NgGridItem, position:{col:number, row:number}) {
        this.placeholder.registerGrid(item._ngGrid);
        this.placeholder.setGridPosition(position.col, position.row);
        this.placeholder.setSize(item.getDimensions().width, item.getDimensions().height);
    }

    ngOnInit():any {
        this.createPlaceholder();
    }

    private createPlaceholder() {
        this.cmpResolver.resolveComponent(NgGridPlaceholder)
            .then((factory:ComponentFactory) => {
                this.placeholder = factory
                    .create(this.viewContainer.injector, undefined, this.window.document.body)
                    .instance;
            });
    }
}