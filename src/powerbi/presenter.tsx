import { ReactVisualPresenter } from "pbi-stateful";
import AttributeSlicer from "../attributeSlicer";
import { store as storeFactory } from "../state/store";
import { Provider, Store } from "react-redux";
import { loadData, changeDimensions } from "../state/actions";
import dataConversion from "./data";

/* tslint:disable */
const React = require("react");
const CSS_MODULE = require("!css!sass!./style/visual.scss");
/* tslint:enable */

/**
 * The visual presenter for AttributeSlicerVisual
 */
export default class AttributeSlicerVisualPresenter extends ReactVisualPresenter {

    /**
     * My store
     */
    private myStore: Store<any>;

    /**
     * Css objects that will be injected
     */
    private injectedCss: string;

    /**
     * Constructor for the visual presenter
     */
    constructor(store?: Store<any>, injectedCss?: string) {
        super();
        this.myStore = store || storeFactory();
        this.injectedCss = injectedCss;
    }

    /**
     * Renders the attribute slicer
     */
    public renderVisual() {
        return (
            <Provider store={ this.myStore }>
                <div className={ CSS_MODULE.locals && CSS_MODULE.locals.className }>
                    <AttributeSlicer></AttributeSlicer>
                </div>
            </Provider>
        );
    }

    /**
     * Update call for the visual
     */
    public update(options: powerbi.VisualUpdateOptions) {
        super.update(options);

        // Resize
        this.myStore.dispatch(changeDimensions(options.viewport));

        // Data load
        const data = dataConversion(options.dataViews && options.dataViews[0]);
        this.myStore.dispatch(loadData(data));
    }

    /**
     * Gets the frame header styles
     */
    protected get frameHead(): any {
        return (<style dangerouslySetInnerHTML={{ __html: this.css }}></style>);
    }

    /**
     * Getter for the iframe css
     */
    protected get iframeCss() {
        return [CSS_MODULE + "" + (this.injectedCss || "")];
    }
}
