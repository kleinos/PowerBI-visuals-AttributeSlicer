import AttributeSlicer from "./AttributeSlicerVisual";
import { IStateful, stateful, IStateChangeListener } from "pbi-stateful";
import { UpdateType } from "essex.powerbi.base";
import { ISettings, ListItem } from "./interfaces";
import { Visual } from "essex.powerbi.base";
import PixelConverter = jsCommon.PixelConverter;

/**
 * Represents an attribute slicer which is stateful
 */
@stateful
@Visual(require("../build").output.PowerBI)
class StatefulAttributeSlicer extends AttributeSlicer implements IStateful<IAttributeSlicerState> {

    /**
     * The list of state change listeners
     */
    private listeners: IStateChangeListener<IAttributeSlicerState>[] = [];

    /**
     * The current state that we are in
     */
    private _state: IAttributeSlicerState;

    /**
     * Gets the name of the stateful component
     */
    public get name() { return "AttributeSlicer"; };

    /**
     * List of state change listeners
     */
    public get stateChangeListeners(): IStateChangeListener<IAttributeSlicerState>[] {
        return this.listeners.slice(0);
    }

    /**
     * Gets the current state
     */
    public get state(): IAttributeSlicerState {
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
        };;
    }

    /**
     * Setter for the state
     */
    public set state(state: IAttributeSlicerState) {
        var test = "";
    }

    /**
     * Registers a state change listener for the state
     */
    public registerStateChangeListener(listener: IStateChangeListener<IAttributeSlicerState>) {
        if (listener) {
            this.listeners.push(listener);
        }
    }

    /**
     * Loads a new set of settings
     */
    public loadSettings(newSettings: ISettings, dataUpdate: boolean) {
        const changes = super.loadSettings(newSettings, dataUpdate);
        return changes;
    }

    /**
     * Update function for IVisual
     */
    public update(options: powerbi.VisualUpdateOptions) {
        super.update(options);

        const updateType = this.updateType();
        if ((updateType & UpdateType.Settings) > 0) {

        }
    }
}

/**
 * Represents the attribute slicer state
 */
interface IAttributeSlicerState {

}