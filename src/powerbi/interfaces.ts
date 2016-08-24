import { SlicerItem } from "../interfaces";
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;
import data = powerbi.data;

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint, TooltipEnabledDataPoint { }

/**
 * Represents the state of the attribute slicer
 */
export interface IAttributeSlicerState {

    /**
     * The currently selected search text
     */
    searchText: string;

    /**
     * The list of selected items
     */
    selectedItems?: {
        match: any;
        value: any;
        renderedValue: any;
        selector: any;
    }[];

    /**
     * The set of settings for the attribute slicer
     */
    settings: IAttributeSlicerSettings;
}

/**
 * Represents slicer data
 */
export interface ISlicerVisualData {
    /**
     * The actual dataset
     */
    data: SlicerItem[];

    /**
     * Metadata which describes the data
     */
    metadata: { 
        /**
         * The name of the category column
         */
        categoryColumnName: string;

        /**
         * Whether or not there is even categories
         */
        hasCategories: boolean;
    };
};

/**
 * The attribute slicer settings
 */
export interface IAttributeSlicerSettings {

    general: {    
        /**
         * The text size in pt
         */
        textSize: number;

        /**
         * If we should show the options area
         */
        showOptions: boolean;

    }

    display: {

        /**
         * The percentage based width of the value column 0 = hidden, 100 = whole screen
         */
        valueColumnWidth: number;

        /**
         * The display units to use when rendering values
         */
        labelDisplayUnits: number;

        /**
         * The precision of the numbers to render
         */
        labelPrecision: number;

        /**
         * If we are being rendered horizontally
         */
        horizontal: boolean;
    }

    selection: {
        /**
         * If we should single select
         */
        singleSelect: boolean;

        /**
         * If brushMode is enabled
         */
        brushMode: boolean;

        /**
         * If we should show the tokens
         */
        showSelections: boolean;
    }
}

export type SlicerItem = SlicerItem;

/**
 * Contains a list of settings descriptions
 */
export const SETTING_DESCRIPTORS: IAttributeSlicerSettings = {
    general: {
        displayName: "General",
        textSize: {
            displayName: "Text Size",
            type: { numeric: true },
        } as any,
        showOptions: {
            displayName: "Show Options",
            description: "Should the search box and other options be shown",
            type: { bool: true },
        } as any,
    } as any,
    selection: {
        displayName: "Selection",
        brushMode: {
            displayName: "Brush Mode",
            description: "Allow for the drag selecting of attributes",
            type: { bool: true },
        } as any,
        singleSelect: {
            displayName: "Single Select",
            description: "Only allow for a single selected",
            type: { bool: true },
        } as any,
        showSelections: {
            displayName: "Use Tokens",
            description: "Will show the selected attributes as tokens",
            type: { bool: true },
        } as any,
    } as any,
    display: {
        displayName: "Display",
        valueColumnWidth: {
            displayName: "Value Width %",
            description: "The percentage of the width that the value column should take up.",
            type: { numeric: true },
        } as any,
        horizontal: {
            displayName: "Horizontal",
            description: "Display the attributes horizontally, rather than vertically",
            type: { bool: true },
        } as any,
        labelDisplayUnits: 
            $.extend(true, {}, StandardObjectProperties.labelDisplayUnits as any, { displayName: "Display Units" }),
        labelPrecision: 
            $.extend(true, {}, StandardObjectProperties.labelPrecision as any, { displayName: "Precision" }),
    } as any
};
