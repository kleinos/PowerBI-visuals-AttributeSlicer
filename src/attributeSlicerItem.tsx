import * as React from "react";
import { SlicerItem } from "./interfaces";
import { prettyPrintValue as pretty } from "./utils";

/**
 * A component which allows for visualizing attributes in a searchable list.
 */
export default class AttributeSlicerItem extends React.Component<any, any> {
    public render() {
        const { match, matchPrefix, matchSuffix, sections, renderedValue } = this.props.item as SlicerItem;
        const sizes = this.props.sizes as { category: number; value: number };
        const categoryStyle = {
            "display": "inline-block",
            "overflow": "hidden",
            "maxWidth": sizes.category + "%"
        };
        return (
            <div style={{ "whiteSpace": "nowrap", "cursor":"pointer" }} className="item">
                <div style={{ "marginLeft": "5px", "verticalAlign": "middle", "height": "100%" }} className="display-container">
                    <span style={categoryStyle} title="${pretty(match)}" className="category-container">
                        <span className="matchPrefix">{pretty(matchPrefix)}</span>
                        <span className="match">{pretty(match)}</span>
                        <span className="matchSuffix">{pretty(matchSuffix)}</span>
                    </span>
                    <span style={{ display:"inline-block", "maxWidth": sizes.value + "%", height: "100%" }} className="value-container">
                        <span style={{ display:"inline-block", width: renderedValue + "%", height: "100%" }}>
                        {
                            (sections || []).map(s => {
                                let color = s.color || "";
                                const displayValue = s.displayValue || s.value || "0";
                                const style = {
                                    display: "inline-block",
                                    width: s.width + "%",
                                    backgroundColor: color,
                                    height: "100%"
                                };
                                return (
                                    <span style={{style}} title={displayValue} className="value-display">
                                        &nbsp;<span className="value">{displayValue}</span>
                                    </span>
                                );
                            }).join("")
                        }
                        </span>
                    </span>
                </div>
            </div>);
    }
}
