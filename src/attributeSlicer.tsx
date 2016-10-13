import * as React from "react";
import { connect } from "react-redux";
import { IState } from "./state/interfaces";
import { SlicerItem } from "./interfaces";
import AttributeSlicerItem from "./attributeSlicerItem";
import * as _ from "lodash";

/* tslint:disable */
const { List } = require("react-virtualized");
/* tslint:enable */

/**
 * A component which allows for visualizing attributes in a searchable list.
 */
export class AttributeSlicer extends React.Component<any, any> {
    public rowRenderer (config: { index: number, key: string, style: Object }) {
        const myData = this.props.data || [];
        const finalStyle = _.cloneDeep(config.style);
        finalStyle["width"] = this.props.dimensions.width + "px";
        return (
            <div key={config.key} style={finalStyle}>
                <AttributeSlicerItem item={myData[config.index]} sizes={{
                    value: 0,
                    category: 100
                }}/>
            </div>
        );
    }
    public render() {
        const toRender: SlicerItem[] = this.props.data || [];
        return (
            <div className="attribute-slicer">
                <List
                    width={this.props.dimensions.width}
                    height={this.props.dimensions.height}
                    rowCount={toRender.length}
                    rowHeight={20}
                    rowRenderer={this.rowRenderer.bind(this)}>
                </List>
            </div>
        );
    }
}

export default connect(
  (state: IState) => ({
      data: state.slicer.data,
      dimensions: state.slicer.dimensions
  })
)(AttributeSlicer);
