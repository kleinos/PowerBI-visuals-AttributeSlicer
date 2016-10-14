import AttributeSlicerVisualPresenter from "./presenter";
import { Visual, VisualBase } from "essex.powerbi.base";
import capabilities from "./capabilities";
import dataConversion from "./data";
import { buildEnumerationObjects, parseSettingsFromPBI } from "../../lib/settings";
import Settings from "./settings";

const ldget = require("lodash/get"); //tslint:disable-line

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
     * The current set of settings
     */
    private currentSettings: Settings;

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

        if (options.dataViews && options.dataViews.length) {
            this.currentSettings = parseSettingsFromPBI(options, Settings);
        }

        this.myPresenter.props = {
            data: dataConversion(options.dataViews && options.dataViews[0]),
            dimensions: options.viewport,
        };
    }

    /**
     * Enumerates the PBI setting values
     */
    public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstance[] {
        const { objectName } = options;
        let instances = super.enumerateObjectInstances(options) || [{
            /*tslint:disable */selector: null/* tslint:enable */,
            objectName: objectName,
            properties: {},
        }] as powerbi.VisualObjectInstance[];

        $.extend(true, instances[0], buildEnumerationObjects(this.currentSettings, objectName)[0]);

        return instances;
    }
}
