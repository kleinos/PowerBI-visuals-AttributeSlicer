import AttributeSlicerVisualPresenter from "./presenter";
import { Visual, VisualBase } from "essex.powerbi.base";
import capabilities from "./capabilities";

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
    private myPresenter: powerbi.IVisual;

    /**
     * Constructor for the AttributeSlicerVisual
     */
    constructor(presenter?: powerbi.IVisual) {
        super(false);
        const faces = super["HACK_getFontFaces"]();
        const fontStyles = (Object.keys(faces).map(n => faces[n].cssText)).join("\n");
        this.myPresenter = presenter || new AttributeSlicerVisualPresenter(undefined, fontStyles);
    }

    /**
     * Initializes the visual
     */
    public init(options: powerbi.VisualInitOptions) {
        this.myPresenter.init(options);
    }

    /**
     * Updates the visual
     */
    public update(options: powerbi.VisualUpdateOptions) {
        this.myPresenter.update(options);
    }
}
