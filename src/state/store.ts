import configureStore from "./configure";
import { IState } from "./interfaces";
import { Store } from "redux";

export const store = (
  initialState?: IState
) => {
  return configureStore(initialState) as Store<IState>;
};
