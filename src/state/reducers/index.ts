import { combineReducers, Reducer } from "redux";
import { IState } from "../interfaces";
import slicerReducer from "./slicer";

export default function createRootReducer() {
    "use strict";
    return combineReducers({
        slicer: slicerReducer
    }) as Reducer<IState>;
}
