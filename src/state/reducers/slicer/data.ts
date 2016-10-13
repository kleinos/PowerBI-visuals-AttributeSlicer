import * as ReduxActions from "redux-actions";
import { LOAD_DATA_TYPE } from "../../actions";
import { ILoadDataPayload } from "../../interfaces";
export default function reduce(state = [] as any, action: ReduxActions.Action<ILoadDataPayload>) {
    "use strict";
    if (action.type === LOAD_DATA_TYPE) {
        return action.payload || [];
    }
    return state;
}
