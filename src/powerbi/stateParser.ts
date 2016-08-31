import {
    ListItem,
    IAttributeSlicerState,
} from "./interfaces";
import { createItem } from "./dataConverter";
import data = powerbi.data;
import SelectionId = powerbi.visuals.SelectionId;

/* tslint:disable */
const ldget = require("lodash.get");
/* tslint:enable */

/**
 * Parses the settings that are stored in powerbi
 */
export default function parseStateFromPowerBI(dataView: powerbi.DataView): IAttributeSlicerState {
    "use strict";
    const objects = dataView && dataView.metadata && dataView.metadata.objects;
    const selfFilter = ldget(objects, "general.selfFilter", undefined);
    const newSearch: data.SemanticFilter = selfFilter;
    const whereItems = newSearch && newSearch.where();
    const contains = whereItems && whereItems.length > 0 && whereItems[0].condition as data.SQContainsExpr;
    const right = contains && contains.right as data.SQConstantExpr;
    const state: IAttributeSlicerState = {
        settings: {
            display: {
                labelDisplayUnits: ldget(objects, "display.labelDisplayUnits", 0),
                labelPrecision: ldget(objects, "display.labelPrecision", 0),
                valueColumnWidth: ldget(objects, "display.valueColumnWidth", undefined),
                horizontal: ldget(objects, "display.horizontal", false),
            },
            general: {
                showOptions: ldget(objects, "general.showOptions", true),
                showSearch:
                    // If the data supports searching, and it is enabled through the PBI UI
                    doesDataSupportSearch(dataView) &&
                    !ldget(objects, "general.selfFilterEnabled", false),
                showValues: ldget(dataView, "categorical.values", []).length > 0,
                textSize: ldget(objects, "general.textSize", undefined),
            },
            selection: {
                singleSelect:  ldget(objects, "selection.singleSelect", false),
                brushMode: ldget(objects, "selection.brushMode", false),
                showSelections: ldget(objects, "selection.showSelections", true),
            },
        },
        searchText: (right && right.value) || "",
    };
    state.selectedItems = parseSelectionFromPBI(dataView) || [];
    return state;
}


/**
 * Loads the selection from PowerBI
 */
function parseSelectionFromPBI(dataView: powerbi.DataView) {
    "use strict";
    const objects = dataView && dataView.metadata && dataView.metadata.objects;
    if (objects) {
        // HAX: Stupid crap to restore selection
        let condition = ldget(objects, "general.filter.whereItems[0].condition");
        let values = ldget(condition, "values");
        let args = ldget(condition, "args");
        let selectedItems: any[] = [];
        if (values && args && values.length && args.length) {
            const selectionItems: ListItem[] = JSON.parse(ldget(objects, "general.selection"));
            let sourceExpr = args[0];
            const selectionIds = values.map((n: any) => {
                return SelectionId.createWithId(powerbi.data.createDataViewScopeIdentity(
                    powerbi.data.SQExprBuilder.compare(data.QueryComparisonKind.Equal,
                        sourceExpr,
                        n[0]
                    )
                ));
            });
            selectedItems = <ListItem[]>selectionIds.map((n: powerbi.visuals.SelectionId, i: number) => {
                const slimItem = selectionItems[i];
                const item =
                    createItem(slimItem.match, slimItem.value, (n.getKey ? n.getKey() : n["key"]), n.getSelector(), slimItem.renderedValue);
                return item;
            });
        }
        return selectedItems;
    } else if (dataView) { // If we have a dataview, but we don't have any selection, then clear it
        return [];
    }
}

/**
 * Calculates whether or not the dataset supports search
 */
function doesDataSupportSearch(dv: powerbi.DataView) {
    "use strict";
    const source = ldget(dv, "categorical.categories[0].source");
    const metadataCols = ldget(dv, "metadata.columns");
    const metadataSource = metadataCols && metadataCols.filter((n: any) => n.roles["Category"])[0];
    if (source && metadataSource) {
        return source && metadataSource && metadataSource.type.text && source.type.text;
    }
    return false;
}
