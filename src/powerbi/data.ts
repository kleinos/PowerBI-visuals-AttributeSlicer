import { ListItem } from "./interfaces";
import IValueFormatter = powerbi.visuals.IValueFormatter;
import SelectionId = powerbi.visuals.SelectionId;
import { createValueFormatter, createCategoryFormatter } from "./formatting";

/* tslint:disable */
const { colors } = require("essex.powerbi.base");
const { full } = colors;
/* tslint:enable */

/**
 * Converts the given dataview into a list of listitems
 */
export default function converter(
    dataView: powerbi.DataView,
    valueFormatter?: IValueFormatter,
    categoryFormatter?: IValueFormatter): ListItem[] {
    "use strict";
    if (!valueFormatter) {
        valueFormatter = createValueFormatter();
    }
    if (!categoryFormatter) {
        categoryFormatter = createCategoryFormatter(dataView);
    }
    let converted: ListItem[];
    const categorical = dataView && dataView.categorical;
    const categories = categorical && categorical.categories;
    const values = categorical && categorical.values;
    let maxValue = 0;
    if (categories && categories.length && categories[0].values) {
        converted = categories[0].values.map((category, catIdx) => {
            let id = SelectionId.createWithId(categories[0].identity[catIdx]);
            let total = 0;
            let sections: any;
            if (values) {
                sections = values.map((v, j) => {
                    const value = v.values[catIdx].valueOf();
                    if (typeof value === "number") {
                        total += <number>value;
                    }
                    return {
                        color: colors[j] || "#ccc",
                        value: value,
                        displayValue: valueFormatter.format(value),
                        width: 0,
                    };
                });
                sections.forEach((s: any) => {
                    s.width = (s.value / total) * 100;
                });
            }
            const item =
                createItem(
                    categoryFormatter ? categoryFormatter.format(category) : `${category.valueOf()}`,
                    total,
                    id.getKey(),
                    id.getSelector(),
                    undefined,
                    "#ccc");
            item.sections = sections;
            if (item.value > maxValue) {
                maxValue = item.value;
            }
            return item as any;
        });
        converted.forEach((c) => {
            c.renderedValue = c.value ? (c.value / maxValue) * 100 : undefined;
        });
        return converted;
    }
    return converted;
}

/**
 * A utility method to create a slicer item
 */
export function createItem(
    category: string,
    value: any,
    id: string,
    selector: powerbi.data.Selector,
    renderedValue?: any,
    color = ""): ListItem {
    "use strict";
    return {
        id: id,
        match: category,
        color: color,
        value: value || 0,
        renderedValue: renderedValue,
        selector: selector,
        equals: (b: ListItem) => id === b.id,
    };
}
