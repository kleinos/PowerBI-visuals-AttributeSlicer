
/**
 * Represents an item in the slicer
 */
export interface SlicerItem {

    /**
     * The unique identifier for this item
     */
    id: string;

    /**
     * The actual match
     */
    match: any;

    matchPrefix?: any;
    matchSuffix?: any;

    /**
     * The color of the item
     */
    color?: string;

    /**
     * The raw value of this item
     */
    value: any;
    // selected: boolean;

    /**
     * Returns true if this == b
     */
    equals: (b: SlicerItem) => boolean;

    /**
     * Called when an item is created
     */
    onCreate?: (ele: JQuery) => void;

    /**
     * The sections that make up this items value, the total of the widths must === 100
     */
    sections?: ISlicerValueSection[];

    /**
     * The percentage value that should be displayed (0 - 100)
     * TODO: Better name, basically it is the value that should be displayed in the histogram
     */
    renderedValue?: number;

    // Special property for Attribute Slicer to optimize lookup
    $element?: JQuery;
}

export interface ISlicerValueSection {
    /**
     * The raw value of the section
     */
    value: any;

    /**
     * The display value of the section
     */
    displayValue: any;

    /**
     * The percentage width of this section
     */
    width: number;

    /**
     * The color of this section
     */
    color: string;
}
