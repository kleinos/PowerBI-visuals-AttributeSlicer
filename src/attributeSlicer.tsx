import * as React from "react";
import { SlicerItem, ISlicerState } from "./interfaces";
import AttributeSlicerItem from "./attributeSlicerItem";
import * as _ from "lodash";

const { List, InfiniteLoader } = require("react-virtualized"); // tslint:disable-line

/**
 * The properties that the slicer supports
 */
export interface IAttributeSlicerProps extends ISlicerState {

    /**
     * The data to load into the slicer
     */
    data: SlicerItem[];

    /**
     * The dimensions of the slicer
     */
    dimensions: {

        /**
         * The width of the slicer
         */
        width: number;

        /**
         * The height of the slicer
         */
        height: number;
    };
}

/**
 * A component which allows for visualizing attributes in a searchable list.
 */
export default class AttributeSlicer extends React.Component<IAttributeSlicerProps, void> {

    /**
     * The renderer for the list which renders attributes
     */
    public rowRenderer (config: { index: number, key: string, style: Object }) {
        const myData = this.props.data || [];
        const finalStyle = _.cloneDeep(config.style);
        finalStyle["width"] = this.props.dimensions.width + "px";
        return (
            <div key={config.key} style={finalStyle}>
                <AttributeSlicerItem item={myData[config.index]} sizes={{
                    value: 0,
                    category: 100,
                }}/>
            </div>
        );
    }

    /**
     * The public render method
     */
    public render() {
        const toRender: SlicerItem[] = this.props.data || [];
        return (
            <div className="attribute-slicer">
                <InfiniteLoader
                    isRowLoaded={(config: any) => config.index < toRender.length}
                    loadMoreRows={() => false }
                    rowCount={toRender.length}>
                    {(config: any) => (
                        <List
                            ref={config.registerChild}
                            onRowsRendered={config.onRowsRendered}
                            rowRenderer={this.rowRenderer.bind(this)}
                            width={this.props.dimensions.width}
                            height={this.props.dimensions.height}
                            rowCount={toRender.length}
                            rowHeight={20}
                        />
                    )}
                </InfiniteLoader>
            </div>
        );
    }
}
