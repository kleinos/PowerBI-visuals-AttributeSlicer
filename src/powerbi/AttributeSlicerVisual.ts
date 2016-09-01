/* tslint:disable */
import {
    logger,
    updateTypeGetter,
    UpdateType,
    PropertyPersister,
    createPropertyPersister,
} from "essex.powerbi.base";
import { isStateEqual } from "../Utils";
import { buildPersistObjectsFromState, buildStateFromPowerBI } from "./stateConversion";
import { buildSelfFilter } from "./expressions";
import { publishChange, StatefulVisual, IDimensions } from "pbi-stateful";
import converter from "./dataConversion";
import capabilities from "./AttributeSlicerVisual.capabilities";
import { createValueFormatter } from "./formatting";

import { default as createPersistObjectBuilder } from "./persistence";
import { ListItem, SlicerItem, SETTING_DESCRIPTORS } from "./interfaces";
import { IAttributeSlicerState } from "../interfaces";
import { AttributeSlicer as AttributeSlicerImpl } from "../AttributeSlicer";
import { VisualBase, Visual } from "essex.powerbi.base";
import * as _ from "lodash";
import IVisualHostServices = powerbi.IVisualHostServices;
import DataView = powerbi.DataView;
import data = powerbi.data;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import PixelConverter = jsCommon.PixelConverter;

const log = logger("essex.widget.AttributeSlicerVisual");
const CUSTOM_CSS_MODULE = require("!css!sass!./css/AttributeSlicerVisual.scss");
const ldget = require("lodash.get");
/* tslint:enable */

// PBI Swallows these
const EVENTS_TO_IGNORE = "mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown";

@Visual(require("../build").output.PowerBI)
export default class AttributeSlicer extends StatefulVisual<IAttributeSlicerState> {

    /**
     * The set of capabilities for the visual
     */
    public static capabilities = capabilities;

    /**
     * My AttributeSlicer
     */
    protected mySlicer: AttributeSlicerImpl;

    /**
     * The display units for the values
     */
    protected labelDisplayUnits = 0;

    /**
     * The precision to use with the values
     */
    protected labelPrecision: number = 0;

    /**
     * The current dataView
     */
    private dataView: DataView;

    /**
     * The host of the visual
     */
    private host: IVisualHostServices;

    /**
     * The deferred used for loading additional data into attribute slicer
     */
    private loadDeferred: JQueryDeferred<SlicerItem[]>;

    /**
     * The current category that the user added
     */
    private currentCategory: any;

    /*
     * The current set of cacheddata
     */
    private data: SlicerItem[];

    /**
     * A property persister
     */
    private propertyPersister: PropertyPersister;

    /**
     * Constructor
     */
    constructor(noCss = false) {
        super(noCss, "Attribute Slicer");

        this["updateType"] = updateTypeGetter(this);

        // Tell base we should not load sandboxed
        VisualBase.DEFAULT_SANDBOX_ENABLED = false;

        const className = CUSTOM_CSS_MODULE && CUSTOM_CSS_MODULE.locals && CUSTOM_CSS_MODULE.locals.className;
        if (className) {
            this.element.addClass(className);
        }

        // HACK: PowerBI Swallows these events unless we prevent propagation upwards
        this.element.on(EVENTS_TO_IGNORE, (e) => e.stopPropagation());
    }

    /**
     * Gets the template associated with the visual
     */
    public get template() {
        return "<div></div>";
    }

    /**
     * Called when the visual is being initialized
     */
    public onInit(options: powerbi.VisualInitOptions): void {
        this.host = options.host;
        this.propertyPersister = createPropertyPersister(this.host, 100);

        const slicerEle = $("<div>");
        this.element.append(slicerEle);
        const mySlicer = new AttributeSlicerImpl(slicerEle);
        mySlicer.serverSideSearch = true;
        mySlicer.events.on("loadMoreData", this.onLoadMoreData.bind(this));
        mySlicer.events.on("canLoadMoreData", this.onCanLoadMoreData.bind(this));
        mySlicer.events.on("selectionChanged", this.onSelectionChanged.bind(this));
        mySlicer.events.on("searchPerformed", this.onSearchPerformed.bind(this));

        // Hide the searchbox by default
        mySlicer.showSearchBox = false;
        this.mySlicer = mySlicer;
        this.mySlicer.dimensions = this.dimensions;

        log("Loading Custom Sandbox: ", this.sandboxed);
    }

    /**
     * Called when the dimensions of the visual have changed
     */
    public onSetDimensions(value: IDimensions) {
        if (this.mySlicer) {
            this.mySlicer.dimensions = value;
        }
    }

    /**
     * Called when the visual is being updated
     */
    public onUpdate(options: powerbi.VisualUpdateOptions, updateType: UpdateType) {
        log("Update", options);

        // Make sure the slicer has some sort of dimensions
        if (!this.mySlicer.dimensions) {
            this.mySlicer.dimensions = options.viewport;
        }

        const dv = this.dataView = options.dataViews && options.dataViews[0];
        const newState = buildStateFromPowerBI(dv);
        this.onUpdateLoadData(updateType, dv, newState);
        this.onUpdateLoadState(dv, newState);
    }

    /**
     * Sets the given state into the attribute slicer
     */
    public onSetState(state: IAttributeSlicerState) {
        log("setstate ", state);

        // The old state passed in the params, is the old *cached* version, so if we change the state ourselves
        // Then oldState will not actually reflect the correct old state.
        const currentState = this.generateState();
        // Since the other one is cached.
        if (!isStateEqual(state, currentState)) {
            state = _.cloneDeep(state);

            // Set the state on the slicer
            this.mySlicer.state = state;

            // Slicer is loaded, now sync with PBI
            const labelPrecision =
                this.labelPrecision !== (this.labelPrecision = ldget(state, "settings.display.labelPrecision", 0));
            const labelDisplayUnits =
                this.labelDisplayUnits !== (this.labelDisplayUnits = ldget(state, "settings.display.labelDisplayUnits", 0));

            if ((labelPrecision || labelDisplayUnits) && this.mySlicer.data) {
                const formatter = createValueFormatter(this.labelDisplayUnits, this.labelPrecision);

                // Update the display values in the datas
                this.mySlicer.data.forEach(n => {
                    (n.sections || []).forEach(section => {
                        section.displayValue = formatter.format(section.value);
                    });
                });

                // Tell the slicer to repaint
                this.mySlicer.refresh();
            }

            this.writeStateToPBI(state);
        }
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
        const state = this.state;
        if (state.settings[options.objectName]) {
            _.merge(props, state.settings[options.objectName]);
        }
        if (options.objectName === "general") {
            props["textSize"] = PixelConverter.toPoint(parseFloat(props["textSize"] + ""));
        }
        return instances;
    }

    /**
     * Gets called when PBI destroys this visual
     */
    public destroy() {
        super.destroy();
        if (this.mySlicer) {
            this.mySlicer.destroy();
        }
    }

    /**
     * Gets the inline css used for this element
     */
    protected getCustomCssModules(): any[] {
        return [CUSTOM_CSS_MODULE];
    }

    /**
     * Generates a new state
     */
    protected generateState() {
        const baseState = this.mySlicer.state;
        return _.merge({}, baseState, {
            settings: {
                display: {
                    labelDisplayUnits: this.labelDisplayUnits || 0,
                    labelPrecision: this.labelPrecision || 0,
                },
            },
        });
    }

    /**
     * Checks whether or not to load data from the dataView
     */
    private onUpdateLoadData(updateType: UpdateType, dv: DataView, pbiState: IAttributeSlicerState) {
        // Load data if the data has definitely changed, sometimes however it hasn't actually changed
        // ie search for Microsof then Microsoft
        if (dv) {
            if ((updateType & UpdateType.Data) === UpdateType.Data || this.loadDeferred) {
                const data = converter(dv);

                log("Loading data from PBI");

                this.data = data || [];
                let filteredData = this.data.slice(0);

                // If we are appending data for the attribute slicer
                if (this.loadDeferred && this.mySlicer.data && !this.loadDeferred["search"]) {
                    // we only need to give it the new items
                    this.loadDeferred.resolve(filteredData.slice(this.mySlicer.data.length));
                    delete this.loadDeferred;
                } else {
                    this.mySlicer.data = filteredData;

                    // Restore selection
                    this.mySlicer.selectedItems = <any>(pbiState.selectedItems || []);

                    delete this.loadDeferred;
                }

                const columnName = ldget(dv, "categorical.categories[0].source.queryName");

                // if the user has changed the categories, then selection is done for
                if (!columnName ||
                    (this.currentCategory && this.currentCategory !== columnName)) {
                    // This will really be undefined behaviour for pbi-stateful because this indicates the user changed datasets
                    log("Clearing Selection, Categories Changed");
                    pbiState.selectedItems = [];
                    pbiState.searchText = "";
                }

                this.currentCategory = columnName;
            }
        } else {
            this.mySlicer.data = [];
            pbiState.selectedItems = [];
        }
    }

    /**
     * Checks if the settings have changed from PBI
     */
    private onUpdateLoadState(dv: DataView, pbiState: IAttributeSlicerState) {
        // Important that this is done down here for selection to be retained
        // const newState = this.generateState();
        const oldState = this.state;
        if (!isStateEqual(oldState, pbiState)) {

            const oldSettings = oldState.settings;
            const newSettings = pbiState.settings;
            const differences: string[] = [];
            Object.keys(newSettings).forEach(secN => {
                const section = newSettings[secN];
                Object.keys(section).forEach(setN => {
                    const oldSetting = ldget(oldSettings, `${secN}.{setN}`);
                    const newSetting = ldget(newSettings, `${secN}.{setN}`);
                    if (!_.isEqual(oldSetting, newSetting)) {
                        const descriptor = SETTING_DESCRIPTORS[secN][setN];
                        differences.push(descriptor ? descriptor.displayName : setN);
                    }
                });
            });

            // New state has changed, so update the slicer
            log("PBI has changed, updating state");
            this.state = pbiState;

            // If there are any settings updates
            if (differences.length || !_.isEqual(oldSettings, newSettings)) {
                const name = `Updated Settings${ differences.length ? ": " + differences.join(", ") : "" }`;
                publishChange(this, name, pbiState);
            }
        }
    }

    /* tslint:disable */
    /**
     * The debounced version of the selection changed
     */
    private _onSelectionChangedDebounced = _.debounce( /* tslint:enable */
        (selectedItems: ListItem[]) => {
            log("onSelectionChanged");
            const selection = selectedItems.map(n => n.match).join(",");
            const text = selection && selection.length ? `Selected ${selection}` : "Cleared Selection";
            const newState = this.generateState();
            publishChange(this, text, newState);
            this.writeStateToPBI(newState);
        },
    100);

    /**
     * Listener for when the selection changes
     */
    private onSelectionChanged(newItems: ListItem[]) {
        if (!this.isHandlingSetState && !this.isHandlingUpdate) {
            this._onSelectionChangedDebounced(newItems);
        }
    }

    /**
     * Listener for searches being performed
     */
    private onSearchPerformed(searchText: string) {
        if (!this.isHandlingSetState) {
            const text = searchText && searchText.length ? `Searched for "${searchText}"` : "Cleared Search";
            publishChange(this, text, this.generateState());
        }
    }

    /**
     * Listener for can load more data
     */
    private onCanLoadMoreData(item: any, isSearch: boolean) {
        return item.result = !!this.dataView && (isSearch || !!this.dataView.metadata.segment);
    }

    /**
     * Listener for when loading more data
     */
    private onLoadMoreData(item: any, isSearch: boolean) {
        if (isSearch) {
            // Set the search filter on PBI
            const builder = createPersistObjectBuilder();
            builder.persist("general", "selfFilter", buildSelfFilter(this.dataView, this.mySlicer.searchString));
            this.propertyPersister.persist(false, builder.build());

            // Set up the load deferred, and load more data
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
     * Syncs the given state back to PBI
     */
    private writeStateToPBI(state: IAttributeSlicerState) {
        log("AttributeSlicer loading state into PBI", state);

        if (this.host) {
            // Stolen from PBI's timeline
            this.propertyPersister.persist(true, buildPersistObjectsFromState(this.dataView, state));
        }
    }
}
