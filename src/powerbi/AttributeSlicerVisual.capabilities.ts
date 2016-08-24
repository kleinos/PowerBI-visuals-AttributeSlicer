import { VisualBase } from "essex.powerbi.base";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import { SETTING_DESCRIPTORS } from "./interfaces";
import { DATA_WINDOW_SIZE } from "./AttributeSlicerVisual.defaults";
import data = powerbi.data;

export default $.extend(true, {}, VisualBase.capabilities, {
        dataRoles: [
            {
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: "Category",
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
                displayName: "Values",
            },
        ],
        dataViewMappings: [{
            conditions: [{ "Category": { max: 1, min: 0 }, "Values": { min: 0 }}],
            categorical: {
                categories: {
                    for: { in: "Category" },
                    dataReductionAlgorithm: { window: { count: DATA_WINDOW_SIZE } },
                },
                values: {
                    select: [{ for: { in: "Values" }}],
                    dataReductionAlgorithm: { top: {} },
                },
            },
        }, ],
        // sort this crap by default
        sorting: {
            default: {}
        },
        objects: $.extend(true, {}, {
            general: {
                displayName: data.createDisplayNameGetter("Visual_General"),
                properties: {
                    filter: {
                        type: { filter: {} },
                        rule: {
                            output: {
                                property: "selected",
                                selector: ["Values"],
                            },
                        },
                    },
                    // formatString: StandardObjectProperties.formatString,
                    selection: {
                        type: { text: {} }
                    },
                    selfFilter: {
                        type: { filter: { selfFilter: true } }
                    },
                    selfFilterEnabled: {
                        type: { operations: { searchEnabled: true } }
                    },
                },
            }
        }, buildObjects()),
    });

function buildObjects() {
    "use strict";
    const objects = {};
    Object.keys(SETTING_DESCRIPTORS).forEach(section => {
        const objProps = objects[section] = {
            properties: {}
        };
        const props = SETTING_DESCRIPTORS[section];
        Object.keys(props).forEach(propName => {
            if (propName === "displayName") {
                objProps[propName] = props[propName];
            }
            objProps.properties[propName] = props[propName];
        });
    });
    return objects;
}
