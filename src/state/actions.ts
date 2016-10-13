import * as ReduxActions from "redux-actions";
import { ILoadDataPayload, IChangeDimensionsPayload } from "./interfaces";

/**
 * The load data action type
 */
export const LOAD_DATA_TYPE = "LOAD_DATA";

/**
 * The change dimensions action type
 */
export const CHANGE_DIMENSIONS_TYPE = "CHANGE_DIMENSIONS";

/**
 * The load data action
 */
export const loadData = ReduxActions.createAction<ILoadDataPayload>(LOAD_DATA_TYPE);

/**
 * The change dimensions action
 */
export const changeDimensions = ReduxActions.createAction<IChangeDimensionsPayload>(CHANGE_DIMENSIONS_TYPE);
