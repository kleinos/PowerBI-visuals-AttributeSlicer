import { logger } from "essex.powerbi.base/dist/lib/utils/logger";
const log = logger("essex.widget.AttributeSlicerVisual");

import { StateManager } from "pbi-stateful/src/StateManager";
import { IAttributeSlicerState } from "../interfaces";
import { AttributeSlicer } from "../AttributeSlicer";
import { isEqual } from "lodash";
import { createValueFormatter } from "./formatting";
const ldget = require("lodash.get");

export default class AttributeSlicerStateManager extends StateManager<IAttributeSlicerState> {

    /** The display units for the values */
    protected labelDisplayUnits = 0;

    /**  The precision to use with the values */
    protected labelPrecision: number = 0;

    constructor(
        private mySlicer: AttributeSlicer,
        private writeStateToPBI: (state: IAttributeSlicerState) => void
    ) {
        super("AttributeSlicer");
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
        if (isEqual(state, currentState)) {
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
     * Generates a new state
     */
    public generateState(): IAttributeSlicerState {
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
}
