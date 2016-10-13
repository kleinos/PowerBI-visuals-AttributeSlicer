import { combineReducers, Reducer } from "redux";
import { IState } from "../../interfaces";
import dataReducer from "./data";
import dimensionsReducer from "./dimensions";

export default combineReducers({
    data: dataReducer,
    dimensions: dimensionsReducer
}) as Reducer<IState>;
