import { SlicerItem } from "../interfaces";

/**
 * The payload for the load data action
 */
export interface ILoadDataPayload extends Array<SlicerItem> {}

export interface IChangeDimensionsPayload {
    /**
     * The width dimension
     */
    width: number;

    /**
     * The height dimension
     */
    height: number;
}

/**
 * Represents the state of the application
 */
export interface IState {
    slicer: {
        data: SlicerItem[];
        dimensions: {
            width: number;
            height: number;
        }
    };
};
