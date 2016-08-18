import { SlicerItem } from "../interfaces";
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;

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
     * If we are being rendered horizontally
     */
    horizontal: boolean;

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
     * The text size in pt
     */
    textSize: number;

    /**
     * If we should show the options area
     */
    showOptions: boolean;

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

export type SlicerItem = SlicerItem;
