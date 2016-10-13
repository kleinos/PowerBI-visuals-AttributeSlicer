import { ReactVisualPresenter } from "pbi-stateful";
import { default as AttributeSlicer, IAttributeSlicerProps } from "../attributeSlicer";
import * as ReactDOM from "react-dom";

/* tslint:disable */
const React = require("react");
const CSS_MODULE = require("!css!sass!./style/visual.scss");
/* tslint:enable */

/**
 * The visual presenter for AttributeSlicerVisual
 */
export default class AttributeSlicerVisualPresenter extends ReactVisualPresenter {

    /**
     * Css objects that will be injected
     */
    private injectedCss: string;

    /**
     * The properties for the slicer
     */
    private _props: IAttributeSlicerProps = {
        data: [],
        dimensions: {
            width: 500,
            height: 500,
        },
    };

    /**
     * Constructor for the visual presenter
     */
    constructor(injectedCss?: string) {
        super();
        this.injectedCss = injectedCss;
    }

    /**
     * Renders the attribute slicer
     */
    public renderVisual() {
        return (
            <div className={ CSS_MODULE.locals && CSS_MODULE.locals.className }>
                <AttributeSlicer {...this.props}></AttributeSlicer>
            </div>
        );
    }

    public get props() {
        return this._props;
    }

    public set props(value: IAttributeSlicerProps) {
        this._props = value;
        this.render();
    }

    public render() {
        ReactDOM.render(this.renderVisual(), this.hostContainer[0]);
    }

    /**
     * Getter for the iframe css
     */
    protected get iframeCss() {
        return [CSS_MODULE + "" + (this.injectedCss || "")];
    }
}
