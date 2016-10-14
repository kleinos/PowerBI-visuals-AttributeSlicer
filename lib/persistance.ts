/**
 * Creates a persistence object builder
 */
export default function createPersistObjectBuilder() {
    "use strict";
    const pbiState = {} as powerbi.VisualObjectInstancesToPersist;
    const maps = {
        merge: {},
        remove: {},
    };
    const me = {
        persist: function addToPersist(objectName: string, property: string, value: any, operation?: string, selector?: string) {
            "use strict";
            operation = operation || (typeof value === "undefined" ? "remove" : "merge");
            let obj = maps[operation][objectName];
            if (!obj) {
                obj = {
                    objectName: objectName,
                    selector: selector,
                    properties: {},
                };
                maps[operation][objectName] = obj;
                pbiState[operation] = pbiState[operation] || [];
                pbiState[operation].push(obj);
            }
            obj.properties[property] = value;
            return me;
        },
        build: () => pbiState,
    };
    return me;
}
