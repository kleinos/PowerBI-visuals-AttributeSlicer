import data = powerbi.data;

/**
 * Builds a self filter from the given search string
 */
export function buildSelfFilter(dataView: powerbi.DataView, searchText: string) {
    "use strict";
    let filterExpr: data.SQExpr;
    let filter: data.SemanticFilter;
    if (dataView) {
        const source = dataView.categorical.categories[0].source;
        const sourceType = source.type;
        // Only support "contains" with text columns
        // if (sourceType.extendedType === powerbi.ValueType.fromDescriptor({ text: true }).extendedType) {
        if (searchText) {
            if (sourceType.text) {
                let containsTextExpr = data.SQExprBuilder.text(searchText);
                filterExpr = data.SQExprBuilder.contains(<any>source.expr, containsTextExpr);
            } else {
                let rightExpr: data.SQExpr;
                if (sourceType.numeric) {
                    rightExpr = data.SQExprBuilder.typedConstant(parseFloat(searchText), sourceType);
                } else if (sourceType.bool) {
                    rightExpr = data.SQExprBuilder.boolean(searchText === "1" || searchText === "true");
                }
                if (rightExpr) {
                    filterExpr = data.SQExprBuilder.equal(<any>source.expr, rightExpr);
                }
            }
        }
        if (filterExpr) {
            filter = data.SemanticFilter.fromSQExpr(filterExpr);
        }
    }
    return filter;
}

/**
 * Builds a SQExpr from a serialized version of a selected item
 */
export function buildSQExprFromSerializedSelection(n: data.Selector) {
    "use strict";
    const firstItem = n.data[0] as powerbi.DataViewScopeIdentity;
    const compareExpr = (firstItem.expr || firstItem["_expr"]) as powerbi.data.SQCompareExpr;
    const left = compareExpr.left as powerbi.data.SQColumnRefExpr;
    const leftEntity = left.source as powerbi.data.SQEntityExpr;
    const right = compareExpr.right as powerbi.data.SQConstantExpr;

    // Create the OO version
    const newRight =
        new powerbi.data.SQConstantExpr(powerbi.ValueType.fromDescriptor(right.type), right.value, right.valueEncoded);
    const newLeftEntity = new powerbi.data.SQEntityExpr(leftEntity.schema, leftEntity.entity, leftEntity.variable);
    const newLeft = new powerbi.data.SQColumnRefExpr(newLeftEntity, left.ref);
    const newCompare = new powerbi.data.SQCompareExpr(compareExpr.comparison, newLeft, newRight);
    return newCompare;
}
