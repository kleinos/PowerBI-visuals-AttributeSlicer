import rootReducer from "./reducers";
import { applyMiddleware, createStore, Store } from "redux";
import { IState } from "./interfaces";
const finalCreateStore = applyMiddleware()(createStore);

export default function configureStore(initialState: IState) {
    "use strict";
    return finalCreateStore(rootReducer(), initialState) as Store<IState>;
}
