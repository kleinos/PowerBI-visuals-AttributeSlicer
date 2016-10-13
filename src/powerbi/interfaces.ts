import { SlicerItem } from "../interfaces";

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem {
    // The unique selector for this item
    selector: powerbi.data.Selector;
}
