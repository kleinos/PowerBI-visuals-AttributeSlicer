import { IAttributeSlicerState } from "../interfaces";
import { buildSelfFilter, buildSQExprFromSerializedSelection } from "./expressions";
import data = powerbi.data;
import PixelConverter = jsCommon.PixelConverter;

/**
 * Creates a persistence object builder
 */
export default function createPersistObjectBuilder() {
    "use strict";
    const pbiState = {};
    const maps = {
        merge: {},
        remove: {},
    };
    const me = {
        persist: function addToPersist(objectName: string, property: string, value: any, operation?: string, selector?: string) {
            "use strict";
            operation = operation || (typeof value === "undefined" ? "remove" : "merge");
            let obj = maps[operation][objectName];
            if (!obj) {
                obj = {
                    objectName: objectName,
                    selector: selector,
                    properties: {},
                };
                maps[operation][objectName] = obj;
                pbiState[operation] = pbiState[operation] || [];
                pbiState[operation].push(obj);
            }
            obj.properties[property] = value;
            return me;
        },
        build: () => pbiState,
    };
    return me;
}


/**
 * Builds the appropriate persist objects to persist the given state to PBI
 */
export function buildPersistObjects(dataView: powerbi.DataView, state: IAttributeSlicerState) {
    "use strict";
    let persistBuilder = createPersistObjectBuilder();

    Object.keys(state.settings).forEach(settingSection => {
        const section = state.settings[settingSection];
        Object.keys(section).forEach(prop => {
            let value = section[prop];
            if (prop === "textSize") {
                value = PixelConverter.toPoint(value);
            }
            persistBuilder.persist(settingSection, prop, value);
        });
    });

    const filter = buildSelectionFilter(state);
    let selection: any = undefined;
    if (filter) {
        selection = JSON.stringify(state.selectedItems.map(n => {
            return {
                match: n.match,
                value: n.value,
                renderedValue: n.renderedValue,
            };
        }));
    }

    persistBuilder
        .persist("general", "filter", filter)
        .persist("general", "selection", selection)
        .persist("general", "selfFilter", buildSelfFilter(dataView, state.searchText));

    return persistBuilder.build();
}

/**
 * Gets a selection filter based on the given slice state
 */
function buildSelectionFilter(state: IAttributeSlicerState) {
    "use strict";
    let filter: data.SemanticFilter;
    if (state.selectedItems && state.selectedItems.length) {
        filter = data.Selector.filterFromSelector(state.selectedItems.map(n => {
            const newCompare = buildSQExprFromSerializedSelection(n.selector);
            return {
                data: [{
                    expr: newCompare,
                    key: n.selector.data[0].key,
                }, ],
            };
        }));
    }
    return filter;
}
