import { SlicerItem, IAttributeSlicerSettings, IAttributeSlicerState } from "../interfaces";
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, TooltipEnabledDataPoint {
    // The unique selector for this item
    selector: powerbi.data.Selector;
}

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

export type SlicerItem = SlicerItem;
export type IAttributeSlicerSettings = IAttributeSlicerSettings;
export type IAttributeSlicerState = IAttributeSlicerState;
