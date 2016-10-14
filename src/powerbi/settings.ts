import { default as pbiSetting } from "../../lib/settings";
import { ISlicerState } from "../interfaces";
import PixelConverter = jsCommon.PixelConverter;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;

const ldget = require("lodash/get"); // tslint:disable-line

/**
 * The set of settings loaded from powerbi
 */
export default class AttributeSlicerPowerBISettings implements ISlicerState {

    /**
     * The currently selected search text
     */
    public searchText?: string;

    /**
     * Whether or not the search box should be shown
     */
    @pbiSetting({
        category: "General",
        persist: false, // Don't persist this setting, it is dynamic based on the dataview
        parse(value, desc, options) {
            const dv = ldget(options, "dataViews[0]");
            const isSelfFilterEnabled = ldget(dv, "metadata.objects.general.selfFilterEnabled", false);
            return doesDataSupportSearch(dv) && !isSelfFilterEnabled;
        }
    })
    public showSearch: boolean;

    /**
     * If we are being rendered horizontally
     */
    @pbiSetting({
        category: "Display",
        displayName: "Horizontal",
        description: "Display the attributes horizontally, rather than vertically",
        defaultValue: false,
    })
    public horizontal?: boolean;

    /**
     * The percentage based width of the value column 0 = hidden, 100 = whole screen
     */
    @pbiSetting({
        category: "Display",
        displayName: "Value Width %",
        description: "The percentage of the width that the value column should take up.",
        defaultValue: 80,
    })
    public valueColumnWidth?: number;

    /**
     * The list of selected items
     */
    public selectedItems?: {
        match: any;
        value: any;
        renderedValue: any;
        selector: any;
    }[];

    /**
     * The text size in pt
     */
    @pbiSetting({
        category: "General",
        displayName: "Text Size",
        description: "The size of the text",
        defaultValue: 12,
        parse: val => val ? PixelConverter.fromPointToPixel(parseFloat(val)) : 12,
        compose: val => val ? PixelConverter.toPoint(val) : 8,
    })
    public textSize?: number;

    /**
     * If we should show the options area
     */
    @pbiSetting({
        category: "General",
        displayName: "Show options",
        description: "Should the search box and other options be shown.",
        defaultValue: true,
    })
    public showOptions?: boolean;

    /**
     * The display units to use when rendering values
     */
    @pbiSetting({
        category: "Display",
        displayName: "Display Units",
        description: "The units to use when displaying values.",
        defaultValue: 0,
        config: StandardObjectProperties.labelDisplayUnits,
    })
    public labelDisplayUnits?: number;

    /**
     * The precision of the numbers to render
     */
    @pbiSetting({
        category: "Display",
        displayName: "Display Precision",
        description: "The precision to use when displaying values.",
        defaultValue: 0,
        config: StandardObjectProperties.labelPrecision,
    })
    public labelPrecision?: number;

    /**
     * If we should single select
     */
    @pbiSetting({
        category: "Selection",
        displayName: "Single Select",
        description: "Only allow for one item to be selected at a time",
        defaultValue: false,
    })
    public singleSelect?: boolean;

    /**
     * If brushMode is enabled
     */
    @pbiSetting({
        category: "Selection",
        displayName: "Brush Mode",
        description: "Allow for the drag selecting of attributes",
        defaultValue: false,
    })
    public brushMode?: boolean;

    /**
     * If we should show the tokens
     */
    @pbiSetting({
        category: "Selection",
        displayName: "Use Tokens",
        description: "Will show the selected attributes as tokens",
        defaultValue: true,
    })
    public showSelections?: boolean;

}

/**
 * Calculates whether or not the dataset supports search
 */
function doesDataSupportSearch(dv: powerbi.DataView) {
    "use strict";
    const source = ldget(dv, "categorical.categories[0].source");
    const metadataCols = ldget(dv, "metadata.columns");
    const metadataSource = metadataCols && metadataCols.filter((n: any) => n.roles["Category"])[0];
    if (source && metadataSource) {
        return source && metadataSource && metadataSource.type.text && source.type.text;
    }
    return false;
}
