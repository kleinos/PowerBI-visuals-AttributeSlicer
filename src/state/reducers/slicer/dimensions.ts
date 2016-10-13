import * as ReduxActions from "redux-actions";
import { CHANGE_DIMENSIONS_TYPE } from "../../actions";
import { IChangeDimensionsPayload } from "../../interfaces";

const DEFAULT_STATE = {
    width: 500,
    height: 500
};

export default function reduce(state = DEFAULT_STATE as any, action: ReduxActions.Action<IChangeDimensionsPayload>) {
    "use strict";
    if (action.type === CHANGE_DIMENSIONS_TYPE) {
        return action.payload || DEFAULT_STATE;
    }
    return state;
}
