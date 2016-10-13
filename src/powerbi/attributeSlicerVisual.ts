import AttributeSlicerVisualPresenter from "./presenter";
import { Visual, VisualBase } from "essex.powerbi.base";
import capabilities from "./capabilities";
import dataConversion from "./data";
import { SlicerItem } from "../interfaces";

/**
 * Wrapper around attribute slicer for PowerBI
 */
@Visual(require("../build.json").output.PowerBI)
export default class AttributeSlicerVisual extends VisualBase {

    /**
     * The capabilities for this visual
     */
    public static capabilities = capabilities;

    /**
     * My presenter
     */
    private myPresenter: AttributeSlicerVisualPresenter;

    /**
     * Constructor for the AttributeSlicerVisual
     */
    constructor(presenter?: AttributeSlicerVisualPresenter) {
        super(false);
        this.myPresenter = presenter;
    }

    /**
     * Initializes the visual
     */
    public init(options: powerbi.VisualInitOptions) {
        super.init(options);

        if (!this.myPresenter) {
            const faces = super["HACK_getFontFaces"]();
            const fontStyles = (Object.keys(faces).map(n => faces[n].cssText)).join("\n");
            this.myPresenter = new AttributeSlicerVisualPresenter(fontStyles);
        }
        this.myPresenter.init(options);
    }

    /**
     * Updates the visual
     */
    public update(options: powerbi.VisualUpdateOptions) {
        super.update(options);

        this.myPresenter.update(options);

        this.myPresenter.props = {
            data: dataConversion(options.dataViews && options.dataViews[0]),
            dimensions: options.viewport,
        };
    }
}
