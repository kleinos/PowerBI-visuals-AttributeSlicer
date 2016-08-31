import IValueFormatter = powerbi.visuals.IValueFormatter;
import valueFormatterFactory = powerbi.visuals.valueFormatter.create;

/**
 * Creates a value formatter from the current set of options
 */
export function createValueFormatter(displayUnits = 0, precision = 0) {
    "use strict";
    return valueFormatterFactory({
        value: displayUnits,
        format: "0",
        precision: precision,
    });
}

/**
 * Creates a formatter capable of formatting the categories (or undefined) if not necessary
 */
export function createCategoryFormatter(dataView: powerbi.DataView) {
    "use strict";
    let formatter: IValueFormatter;
    let cats = dataView && dataView.categorical && dataView.categorical.categories;
    if (cats && cats.length && cats[0].source.type.dateTime) {
        let min: Date;
        let max: Date;
        cats[0].values.forEach(n => {
            if (typeof min === "undefined" || min > n) {
                min = n;
            }
            if (typeof max === "undefined" || max < n) {
                max = n;
            }
        });
        if (min && max) {
            formatter = valueFormatterFactory({
                value: min,
                value2: max,
                format: cats[0].source.format || "0",
            });
        }
    }
    return formatter;
}
