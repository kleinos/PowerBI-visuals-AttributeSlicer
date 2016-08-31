import { SlicerItem } from "./interfaces";

/**
 * Pretty prints a value
 */
export function prettyPrintValue (val: any) {
    "use strict";
    // Date check
    if (val && val.toISOString) {
        let dateVal = <Date>val;
        return (dateVal.getMonth() + 1) + "/" +
                dateVal.getDate() + "/" +
                dateVal.getFullYear() + " " +
                dateVal.getHours() + ":" + dateVal.getMinutes() + (dateVal.getHours() >= 12 ? "PM" : "AM");
    }
    return /* tslint:disable */ val === null /* tslint:enable */|| val === undefined ? "" : val + "";
}

/**
 * A utility method to create a slicer item
 */
export function createItem(category: string, value: any, id: string, renderedValue?: any, color = ""): SlicerItem {
    "use strict";
    return {
        id: id,
        match: category,
        color: color,
        value: value || 0,
        renderedValue: renderedValue,
        equals: (b: SlicerItem) => id === b.id,
    };
}
