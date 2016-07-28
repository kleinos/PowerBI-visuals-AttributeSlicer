/* tslint:disable */
import { logger, updateTypeGetter, UpdateType, PropertyPersister, createPropertyPersister } from "essex.powerbi.base";
import capabilities from "./AttributeSlicerVisual.capabilities";
const colors = require("essex.powerbi.base/src/colors").full;

const log = logger("essex:widget:AttributeSlicerVisual");
/* tslint:enable */

// PBI Swallows these
const EVENTS_TO_IGNORE = "mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown";

import { SlicerItem } from "../interfaces";
import { AttributeSlicer as AttributeSlicerImpl } from "../AttributeSlicer";
import { VisualBase, Visual } from "essex.powerbi.base";
import * as _ from "lodash";
import IVisual = powerbi.IVisual;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualCapabilities = powerbi.VisualCapabilities;
import DataView = powerbi.DataView;
import SelectionId = powerbi.visuals.SelectionId;
import data = powerbi.data;
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import IValueFormatter = powerbi.visuals.IValueFormatter;
import valueFormatterFactory = powerbi.visuals.valueFormatter.create;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
import PixelConverter = jsCommon.PixelConverter;
import { ISlicerState } from "../interfaces";

@Visual(require("../build").output.PowerBI)
export default class AttributeSlicer extends VisualBase implements IVisual {

    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = capabilities;

    /**
     * The current dataView
     */
    private dataView: DataView;

    /**
     * The host of the visual
     */
    private host: IVisualHostServices;

    /**
     * My AttributeSlicer
     */
    private mySlicer: AttributeSlicerImpl;

    private loadDeferred: JQueryDeferred<SlicerItem[]>;

    /**
     * The current category that the user added
     */
    private currentCategory: any;

    /**
     * Whether or not we are currently loading data
     */
    private loadingData = false;

    /*
     * The current set of cacheddata
     */
    private data: SlicerItem[];

    /**
     * Updates the data filter based on the selection
     */
    private onSelectionChanged = _.debounce(
        (selectedItems: ListItem[]) => {
            log("onSelectionChanged");
            this.updateSelectionFilter(selectedItems);
        },
        100);

    /**
     * Getter for the update type
     */
    private updateType = updateTypeGetter(this);

    /**
     * The display units for the values
     */
    private labelDisplayUnits = 0;

    /**
     * The precision to use with the values
     */
    private labelPrecision: number;

     /**
      * The currently loading state
      */
     private loadingState: ISlicerState;

     /**
      * Current loaded state
      */
     private state: ISlicerState;

    /**
     * A property persister
     */
    private propertyPersister: PropertyPersister;

    /**
     * Whether or not to include css
     */
    private noCss: boolean;

    /**
     * Constructor
     */
    constructor(noCss = false) {
        super();

        this.noCss = noCss;

        // Tell base we should not load sandboxed
        VisualBase.DEFAULT_SANDBOX_ENABLED = false;
    }

    /**
     * Converts the given dataview into a list of listitems
     */
    public static converter(
        dataView: DataView,
        valueFormatter: IValueFormatter,
        categoryFormatter?: IValueFormatter): ListItem[] {
        let converted: ListItem[];
        const categorical = dataView && dataView.categorical;
        const categories = categorical && categorical.categories;
        const values = categorical && categorical.values;
        let maxValue = 0;
        if (categories && categories.length && categories[0].values) {
            converted = categories[0].values.map((category, catIdx) => {
                let id = SelectionId.createWithId(dataView.table.identity[catIdx]);
                let total = 0;
                let sections: any;
                if (values) {
                    sections = values.map((v, j) => {
                        const value = v.values[catIdx];
                        total += value;
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
                let item =
                    AttributeSlicer.createItem(
                        categoryFormatter ? categoryFormatter.format(category) : category,
                        total,
                        id,
                        undefined,
                        "#ccc");
                // item.onCreate = (ele: JQuery) => {
                //     TooltipManager.addTooltip(d3.select(ele[0]), (te) => item.tooltipInfo);
                // };
                item.tooltipInfo = (sections || []).map((n: any, j: number) => {
                    return {
                        displayName: values[j].source.displayName,
                        value: n.displayValue,
                    };
                });
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
     * Creates an item
     */
    public static createItem(category: string, value: any, id: SelectionId, renderedValue?: any, color = ""): ListItem {
        return {
            match: category,
            identity: id,
            selected: false,
            color: color,
            value: value || 0,
            renderedValue: renderedValue,
            equals: (b: ListItem) => id.equals((<ListItem>b).identity),
        };
    }

    /**
     * Called when the visual is being initialized
     */
    public init(options: powerbi.VisualInitOptions): void {
        this.register();
        super.init(options, `<div></div>`.trim());

        // HAX: I am a strong, independent element and I don't need no framework tellin me how much focus I can have
        this.element.on(EVENTS_TO_IGNORE, (e) => e.stopPropagation());

        this.host = options.host;
        this.propertyPersister = createPropertyPersister(this.host, 100);

        this.mySlicer = this.createAttributeSlicer(options.element);

        log("Loading Custom Sandbox: ", this.sandboxed);
    }

    /**
     * Called when the visual is being updated
     */
    public update(options: powerbi.VisualUpdateOptions) {
        const updateType = this.updateType();
        super.update(options);

        // Make sure the slicer has some sort of dimensions
        if (!this.mySlicer.dimensions) {
            this.mySlicer.dimensions = options.viewport;
        }

        if ((updateType & UpdateType.Resize) === UpdateType.Resize) {
            this.mySlicer.dimensions = options.viewport;
        }

        this.loadingData = true;
        const dv = this.dataView = options.dataViews && options.dataViews[0];
        if (dv) {
            if ((updateType & UpdateType.Settings) === UpdateType.Settings) {
                // We need to reload the data if the case insensitivity changes (this filters the data and sends it to the slicer)
                const changes = this.loadSettingsFromPowerBI(dv);

                // If the displayUnits or precision changed, and we don't have a data update,
                // then we need to manually refresh the renderedValue of the items
                if ((changes.displayUnits || changes.precision) &&
                    (updateType & UpdateType.Data) !== UpdateType.Data &&
                    this.mySlicer.data &&
                    this.mySlicer.data.length) {
                    const formatter = this.createValueFormatter();
                    this.mySlicer.data.forEach(n => {
                        (n.sections || []).forEach(s => {
                            s.displayValue = formatter.format(s.value);
                        });
                    });
                    this.mySlicer.refresh();
                }

                // If we went from multiple to single, then update the selection filter accordingly
                if (this.mySlicer.singleSelect && changes.singleSelect) {
                    // Let it know that selection has changed, eventually
                    // Normally would do a return; after this, but there are circumstances in which this may cause other issues
                    // ie. If data hasn't been loaded in the first place, then on the next update there will be no data changes
                    // according to our change detector
                    // OR if the selection hasn't actually changed, and we short circuit it, the data won't have a chance to load.
                    // I guess it's safer/easier to do this than to think of all the possible issues doing it the other way.
                    this.onSelectionChanged(this.mySlicer.selectedItems as ListItem[]);
                }

                // If any have changed
                const changedKeys = _.filter(Object.keys(changes), (m) => changes[m]);
                if (!this.loadingState && changedKeys.length) {
                    const newState = this.buildState();
                    let prettyMessage = "Updated Settings: " + changedKeys.map(n => {
                        return n;
                    }).join(", ");
                    this.publishStateChange(prettyMessage, newState);
                }
            }

            // We should show values if there are actually values
            // IMPORTANT: This stays before loadDataFromPowerBI, otherwise the values don't display
            const categorical = dv && dv.categorical;
            const metadata = dv && dv.metadata;
            this.mySlicer.showValues = !!categorical && !!categorical.values && categorical.values.length > 0;
            let isSupportedSearchType = false;
            if (categorical && categorical.categories && categorical.categories.length) {
                const source = categorical.categories[0].source;
                isSupportedSearchType = source && (source.type.numeric || source.type.text || source.type.bool);
            }
            const showSearch =
                isSupportedSearchType &&
                !this.syncSettingWithPBI(metadata && metadata.objects, "general", "selfFilterEnabled", false);
            this.mySlicer.showSearchBox = showSearch;
            if (!showSearch) {
                this.mySlicer.searchString = "";
            }

            if ((updateType & UpdateType.Data) === UpdateType.Data ||
                // Data may not have changed, ie search for Microsof then Microsoft
                this.loadDeferred) {
                this.loadDataFromPowerBI(dv);
            }
            // this.loadSortFromPowerBI(dv);
            this.loadSelectionFromPowerBI(dv);
        } else {
            this.mySlicer.data = [];
            this.mySlicer.selectedItems = [];
        }
        this.loadingData = false;
        delete this.loadingState;
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances = super.enumerateObjectInstances(options) || [{
            /*tslint:disable */selector: null/* tslint:enable */,
            objectName: options.objectName,
            properties: {},
        }, ];
        const instance = instances[0];
        const props = instance.properties;
        if (options.objectName === "general") {
            _.merge(props, {
                textSize: PixelConverter.toPoint(this.mySlicer.fontSize),
                showOptions: this.mySlicer.showOptions,
            });
        } else if (options.objectName === "display") {
            _.merge(props, {
                valueColumnWidth: this.mySlicer.valueWidthPercentage,
                horizontal: this.mySlicer.renderHorizontal,
                labelDisplayUnits: this.labelDisplayUnits,
                labelPrecision: this.labelPrecision,
            });
        } else if (options.objectName === "selection") {
            _.merge(props, {
                singleSelect: this.mySlicer.singleSelect,
                brushMode: this.mySlicer.brushSelectionMode,
                showSelections: this.mySlicer.showSelections,
            });
        }
        return instances;
    }

    /**
     * Gets called when PBI destroys this visual
     */
    public destroy() {
        if (this.mySlicer) {
            this.mySlicer.destroy();
        }
    }

     /**
      * Loads the given state
      */
     public setState(state: ISlicerState) {
         console.log("AttributeSlicer loading state", state);

         if (_.isEqual(state, this.state)) {
             return;
         }

         this.loadingState = state;
         this.state = state;

         if (this.host) {
             // TODO: Save state back to PBI
             const pbiState = {
                 "merge": [
                     <powerbi.VisualObjectInstance>{
                         objectName: "search",
                         selector: undefined,
                         properties: {
                             "caseInsensitive": state.caseInsensitive,
                             "textSize": state.textSize,
                         },
                     },
                     <powerbi.VisualObjectInstance>{
                         objectName: "general",
                         selector: undefined,
                         properties: {
                             "showOptions": state.showOptions,
                             "textSize": state.textSize,
                         },
                     },
                     <powerbi.VisualObjectInstance>{
                         objectName: "selection",
                         selector: undefined,
                         properties: {
                             "singleSelect": state.singleSelect,
                             "brushMode": state.brushMode,
                             "showSelections": state.showSelections,
                         },
                     },
                     <powerbi.VisualObjectInstance>{
                         objectName: "display",
                         selector: undefined,
                         properties: {
                             "labelDisplayUnits": state.labelDisplayUnits,
                             "labelPrecision": state.labelPrecision,
                             "valueColumnWidth": state.valueColumnWidth,
                             "horizontal": state.horizontal,
                         },
                     }
                 ],
             };

             let filter: data.SemanticFilter;
             if (state.selectedItems && state.selectedItems.length) {
                 filter = data.Selector.filterFromSelector(state.selectedItems.map(n => {
                     return n.selector;
                 }));
             }

             let objects: powerbi.VisualObjectInstancesToPersist = { };
             let operation = "merge";
             let selection: any = undefined;
             if (filter) {
                 selection = JSON.stringify(state.selectedItems.map(n => {
                     return {
                         match: n.match,
                         value: n.value,
                         renderedValue: n.renderedValue
                     };
                 }));
             } else {
                 operation = "remove";
             }
             let instances = [
                 <powerbi.VisualObjectInstance>{
                     objectName: "general",
                     selector: undefined,
                     properties: {
                         "filter": filter
                     },
                 },
                 <powerbi.VisualObjectInstance>{
                     objectName: "general",
                     selector: undefined,
                     properties: {
                         "selection": selection
                     },
                 },
             ];
             (pbiState[operation] = pbiState[operation] || []).push(...instances);
             this.host.persistProperties(pbiState);

             // Stolen from PBI's timeline
             this.host.onSelect({ data: [] });

             if (this.state.searchText !== this.mySlicer.searchString) {
                 const searchText = this.state.searchText;
                 setTimeout(() => this.mySlicer.search(searchText), 100);
             }
         }
     }

    /**
     * Gets the inline css used for this element
     */
    protected getCss(): string[] {
        return this.noCss ? [] : super.getCss().concat([require("!css!sass!./css/AttributeSlicerVisual.scss")]);
    }

    /**
     * Creates an attribute slicer with the given element
     */
    protected createAttributeSlicer(element: JQuery) {
        const mySlicer = new AttributeSlicerImpl(this.element);
        mySlicer.serverSideSearch = true;
        mySlicer.events.on("loadMoreData", (item: any, isSearch: boolean) => this.onLoadMoreData(item, isSearch));
        mySlicer.events.on("canLoadMoreData", (item: any, isSearch: boolean) => {
            if (isSearch && (!this.state || this.state.searchText !== this.mySlicer.searchString)) {
                this.publishStateChange(`Search for "${this.mySlicer.searchString}"`, this.buildState());
            }
            return item.result = !!this.dataView && (isSearch || !!this.dataView.metadata.segment);
        });
        mySlicer.events.on("selectionChanged", (newItems: ListItem[]) => {
            if (!this.loadingData && !this.loadingState) {
                this.onSelectionChanged(newItems);
            }
        });

        // Hide the searchbox by default
        mySlicer.showSearchBox = false;
        return mySlicer;
    }

    private get name() {
        return "Attribute Slicer";
    }

    /**
     * Listener for when loading more data
     */
    private onLoadMoreData(item: any, isSearch: boolean) {
        if (isSearch) {
            let st = this.mySlicer.searchString;
            let filterExpr: data.SQExpr;
            const source = this.dataView.categorical.categories[0].source;
            const sourceType = source.type;
            // Only support "contains" with text columns
            // if (sourceType.extendedType === powerbi.ValueType.fromDescriptor({ text: true }).extendedType) {
            if (st) {
                if (sourceType.text) {
                    let containsTextExpr = data.SQExprBuilder.text(st);
                    filterExpr = data.SQExprBuilder.contains(<any>source.expr, containsTextExpr);
                } /*else if (sourceType.dateTime) {
                    const parsedDate = moment(st, AttributeSlicer.MOMENT_FORMATS);
                    const dateValue = parsedDate.toDate();
                    filterExpr = data.SQExprBuilder.equal(<any>source.expr, data.SQExprBuilder.dateTime(dateValue)); */
                /* tslint:disable */
                else {
                    /* tslint:enable */
                    let rightExpr: data.SQExpr;
                    if (sourceType.numeric) {
                        rightExpr = data.SQExprBuilder.typedConstant(parseFloat(st), sourceType);
                    } else if (sourceType.bool) {
                        rightExpr = data.SQExprBuilder.boolean(st === "1" || st === "true");
                    }
                    if (rightExpr) {
                        filterExpr = data.SQExprBuilder.equal(<any>source.expr, rightExpr);
                    }
                }
                // if (sourceType.extendedType === powerbi.ValueType.fromDescriptor({ integer: true }).extendedType ||
                //     sourceType.extendedType === powerbi.ValueType.fromDescriptor({ numeric: true }).extendedType ||
                //     sourceType.extendedType === powerbi.ValueType.fromDescriptor({ dateTime: true }).extendedType) {
                //     builderType = "integer";
                // }
            }
            let propToPersist: any;
            let operation = "merge";
            if (filterExpr && st) {
                propToPersist = data.SemanticFilter.fromSQExpr(filterExpr);
            } else {
                operation = "remove";
            }

            this.propertyPersister.persist(false, {
                [operation]: [
                    <powerbi.VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "selfFilter": propToPersist
                        },
                    },
                ],
            });

            this.loadDeferred = $.Deferred();

            // Let the loader know that it is a search
            this.loadDeferred["search"] = true;
            item.result = this.loadDeferred.promise();
        } else if (this.dataView.metadata.segment) {
            let alreadyLoading = !!this.loadDeferred;
            if (this.loadDeferred) {
                this.loadDeferred.reject();
            }

            this.loadDeferred = $.Deferred();
            item.result = this.loadDeferred.promise();
            if (!alreadyLoading) {
                this.host.loadMoreData();
                log("Loading more data");
            }
        }
    }

    /**
     * Creates a value formatter from the current set of options
     */
    private createValueFormatter() {
        return valueFormatterFactory({
            value: this.labelDisplayUnits,
            format: "0",
            precision: this.labelPrecision,
        });
    }

    /**
     * Loads the data from the dataview
     */
    private loadDataFromPowerBI(dataView: powerbi.DataView) {
        log("Loading data from PBI");

        this.data = AttributeSlicer.converter(
            dataView,
            this.createValueFormatter(),
            this.createCategoryFormatter(dataView)) || [];
        let filteredData = this.data.slice(0);

        // If we are appending data for the attribute slicer
        if (this.loadDeferred && this.mySlicer.data && !this.loadDeferred["search"]) {
            // we only need to give it the new items
            this.loadDeferred.resolve(filteredData.slice(this.mySlicer.data.length));
            delete this.loadDeferred;
        } else {
            this.mySlicer.data = filteredData;
            delete this.loadDeferred;
        }

        // Default the number if necessary
        const categorical = dataView.categorical;
        const categories = categorical && categorical.categories;
        const hasCategories = !!(categories && categories.length > 0);
        const source = hasCategories && categorical.categories[0].source;
        const catName = source.queryName;

        // if the user has changed the categories, then selection is done for
        if (!hasCategories || (this.currentCategory && this.currentCategory !== categorical.categories[0].source.queryName)) {
            log("Clearing Selection, Categories Changed");
            this.mySlicer.selectedItems = [];
            this.mySlicer.searchString = "";
            this.updateSelectionFilter([]);
        }

        this.currentCategory = catName;
    }

    /**
     * Creates a formatter capable of formatting the categories (or undefined) if not necessary
     */
    private createCategoryFormatter(dataView: powerbi.DataView) {
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

    /**
     * Loads the selection from PowerBI
     */
    private loadSelectionFromPowerBI(dataView: powerbi.DataView) {
        const objects = dataView && dataView.metadata && dataView.metadata.objects;
        if (objects) {
            // HAX: Stupid crap to restore selection
            let filter = objects["general"] && objects["general"]["filter"];
            let whereItems = filter && filter.whereItems;
            let condition = whereItems && whereItems[0] && whereItems[0].condition;
            let values = condition && condition.values;
            let args = condition && condition.args;
            if (values && args && values.length && args.length) {
                const selectionItems: ListItem[] = JSON.parse(objects["general"]["selection"]);
                let sourceExpr = filter.whereItems[0].condition.args[0];
                const selectionIds = values.map((n: any) => {
                    return SelectionId.createWithId(powerbi.data.createDataViewScopeIdentity(
                        powerbi.data.SQExprBuilder.compare(data.QueryComparisonKind.Equal,
                            sourceExpr,
                            n[0]
                        )
                    ));
                });
                this.mySlicer.selectedItems = <any>selectionIds.map((n: any, i: number) => {
                    const slimItem = selectionItems[i];
                    return AttributeSlicer.createItem(slimItem.match, slimItem.value, n, slimItem.renderedValue);
                });
            } else {
                this.mySlicer.selectedItems = [];
            }
        } else if (dataView) { // If we have a dataview, but we don't have any selection, then clear it
            this.mySlicer.selectedItems = [];
        }
    }

    /**
     * Return the value if not undefined/null otherwise returns the default value
     */
    private getOrDefault(value: any, def: any) {
        /* tslint:disable */
        return value === null || typeof value === "undefined" ? def : value;
        /* tslint:enable */
    }

    /**
     * Synchronizes the given
     */
    private syncSettingWithPBI(objects: any, objectName: string, property: string, def: any) {
        if (objects && objects[objectName]) {
            return this.getOrDefault(objects[objectName][property], def);
        }
        return def;
    }

    /**
     * Loads our settings from the powerbi objects
     */
    private loadSettingsFromPowerBI(dataView: powerbi.DataView) {
        const s = this.mySlicer;
        const objects = dataView && dataView.metadata && dataView.metadata.objects;

        log("Load Settings (Objects): ", JSON.stringify(objects));

        const displayUnits =
            this.labelDisplayUnits !== (this.labelDisplayUnits = this.syncSettingWithPBI(objects, "display", "labelDisplayUnits", 0));
        const precision =
            this.labelPrecision !== (this.labelPrecision = this.syncSettingWithPBI(objects, "display", "labelPrecision", 0));
        const singleSelect =
            s.singleSelect !== (s.singleSelect = this.syncSettingWithPBI(objects, "selection", "singleSelect", false));
        const brushMode =
            s.brushSelectionMode !== (s.brushSelectionMode = this.syncSettingWithPBI(objects, "selection", "brushMode", false));
        const showSelections =
            s.showSelections !== (s.showSelections = this.syncSettingWithPBI(objects, "selection", "showSelections", true));
        const showOptions =
            s.showOptions !== (s.showOptions = this.syncSettingWithPBI(objects, "general", "showOptions", true));

        const newSearch: data.SemanticFilter = this.syncSettingWithPBI(objects, "general", "selfFilter", undefined);
        const whereItems = newSearch && newSearch.where();
        const contains = whereItems && whereItems.length > 0 && whereItems[0].condition as data.SQContainsExpr;
        const right = contains && contains.right as data.SQConstantExpr;
        if (right && right.value && right.value !== this.mySlicer.searchString) {
            this.mySlicer.searchString = right.value;
        }

        const oldVwp = s.valueWidthPercentage;
        s.valueWidthPercentage = this.syncSettingWithPBI(objects, "display", "valueColumnWidth", undefined);

        const horizontal =
            s.renderHorizontal !== (s.renderHorizontal = this.syncSettingWithPBI(objects, "display", "horizontal", false));

        let pxSize = this.syncSettingWithPBI(objects, "general", "textSize", undefined);
        if (pxSize) {
            pxSize = PixelConverter.fromPointToPixel(pxSize);
        }

        const oldFontSize = s.fontSize;
        s.fontSize = pxSize;

        return {
            displayUnits,
            precision,
            singleSelect,
            brushMode,
            showSelections,
            showOptions,
            fontSize: oldFontSize !== s.fontSize,
            horizontal,
            valueWidthPercentage: oldVwp !== s.valueWidthPercentage
        };
    }

    /**
     * Updates the data filter based on the selection
     */
    private updateSelectionFilter(items: ListItem[]) {
        log("updateSelectionFilter");
        let filter: data.SemanticFilter;
        if (items && items.length) {
            let selectors = items.map(n => n.identity.getSelector()).map(n => ({
                data: n.data,
                id: n.id,
                metadata: n.metadata
            }));
            filter = data.Selector.filterFromSelector(selectors);
        }

        let objects: powerbi.VisualObjectInstancesToPersist = {};
        let operation = "merge";
        let selection: any = undefined;
        if (filter) {
            selection = JSON.stringify(items.map(n => ({
                match: n.match,
                value: n.value,
                renderedValue: n.renderedValue,
            })));
        } else {
            operation = "remove";
        }

        $.extend(objects, {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "filter": filter
                    },
                },
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "selection": selection
                    },
                },
            ],
        });

        this.propertyPersister.persist(true, objects);
        setTimeout(() => {
            this.publishStateChange("Selection Changed", this.buildState());
        }, 100);
    }

    private register() {
        console.log("Registering AttributeSlicer");
        // Add this visual to the StatefulVisuals Collection
        if (!window["statefulVisuals"]) {
            window["statefulVisuals"] = [];
        }
        window["statefulVisuals"].push(this);
        if (window["registerStatefulVisual"]) {
            window["registerStatefulVisual"](this);
        }
        window.addEventListener("message", (event) => {
            if (event.data.type === "STATE_INJECTION") {
                const vizState = event.data.visualStates[this.name];
                if (vizState) {
                    console.log(`Visual ${this.name} received state`, vizState);
                    this.setState(vizState);
                }
            }
        }, false);
    }

    /* tslint:disable */
    private onStateChangeListeners: Function[] = [];

    /**
     * Builds the current state
     */
    private buildState(): ISlicerState {
        return {
            selectedItems: this.mySlicer.selectedItems.map(n => {
                return _.merge({}, {
                    match: n.match,
                    value: n.value,
                    renderedValue: n.renderedValue,
                    selector: (<ListItem>n).identity.getSelector()
                });
            }),
            searchText: this.mySlicer.searchString,
            labelDisplayUnits: this.labelDisplayUnits,
            labelPrecision: this.labelPrecision,
            showOptions: this.mySlicer.showOptions,
            showSelections: this.mySlicer.showSelections,
            singleSelect: this.mySlicer.singleSelect,
            brushMode: this.mySlicer.brushSelectionMode,
            textSize: PixelConverter.toPoint(this.mySlicer.fontSize),
            caseInsensitive: this.mySlicer.caseInsensitive,
            horizontal: this.mySlicer.renderHorizontal,
            valueColumnWidth: this.mySlicer.valueWidthPercentage,
        };
    }

    public onStateChange(listener: any) {
        this.onStateChangeListeners.push(listener);
    }

    private publishStateChange(eventLabel: string, state: ISlicerState) {
        this.state = state;
        var payload = {eventLabel, state, visual: this.name};
        console.log(`${this.name} Publishing`, payload);
        window.postMessage({
            type: "VISUAL_STATE_CHANGE",
            payload: payload
        }, "*");
        this.onStateChangeListeners.forEach(listener => listener(payload));
    }
    /* tslint:enable */
}

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint, TooltipEnabledDataPoint { }
