import { IAttributeSlicerState } from "./interfaces";
/**
 * The number of milliseconds before running the search, after a user stops typing.
 */
export const SEARCH_DEBOUNCE = 500;

/**
 * The value column default width
 */
export const DEFAULT_VALUE_WIDTH = 66;

/**
 * The value default text size
 */
export const DEFAULT_TEXT_SIZE = 12;

/**
 * Gets a default state of the slicer
 */
export const DEFAULT_STATE: IAttributeSlicerState = {
    selectedItems: [],
    searchText: "",
    settings: {
        display: {
            labelDisplayUnits: 0,
            labelPrecision: 0,
            horizontal: false,
            valueColumnWidth: DEFAULT_VALUE_WIDTH,
        },
        selection: {
            showSelections: true,
            singleSelect: false,
            brushMode: false,
        },
        general: {
            // TODO: textSize: PixelConverter.toPoint(this.mySlicer.fontSize),
            textSize: 12,
            showOptions: true,
            showSearch: true,
            showValues: true,
        },
    },
};
