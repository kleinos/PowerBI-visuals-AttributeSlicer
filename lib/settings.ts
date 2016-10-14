/**
 * The key used to store settings metadata on the settings class
 */
const METADATA_KEY = "__settings__";

import createPersistObjectBuilder from "./persistance";

/* tslint:disable */
const ldget = require("lodash/get");
const merge = require("lodash/merge");
/* tslint:enable */

/**
 * Defines a setting to be used with powerBI
 */
export default function setting(config: ISettingDescriptor) {
    "use strict";
    return function (target: any, key: string) {
        target.constructor[METADATA_KEY] = target.constructor[METADATA_KEY] || {};
        target.constructor[METADATA_KEY][key] = {
            propertyName: key,
            descriptor: config,
        } as ISetting;
        Object.defineProperty(target, key, {
            writable: true,
            enumerable: true,
        });
        return target;
    };
}

/**
 * Parses settings from powerbi dataview objects
 */
export function parseSettingsFromPBI<T>(options: powerbi.VisualUpdateOptions, ctor: { new (): T }): T {
    "use strict";
    const settingsMetadata = getSettingsMetadata(ctor);
    if (settingsMetadata) {
        const newSettings = new ctor();
        Object.keys(settingsMetadata).forEach(n => {
            const setting = settingsMetadata[n];
            const adapted = convertValueFromPBI(setting, options);
            newSettings[setting.propertyName] = adapted.adaptedValue;
        });
        return newSettings;
    }
}

/**
 * Builds persist objects from a given settings object
 */
export function buildPersistObjects(settingsObj: any, includeHidden = true): powerbi.VisualObjectInstancesToPersist {
    "use strict";
    if (settingsObj) {
        const settingsMetadata = getSettingsMetadata(settingsObj);
        if (settingsMetadata) {
            const builder = createPersistObjectBuilder();
            Object.keys(settingsObj).forEach(key => {
                const setting = settingsMetadata[key];
                const adapted = convertValueToPBI(settingsObj, setting, includeHidden);
                if (adapted) {
                    const { objName, propName } = getPBIObjectNameAndPropertyName(setting);
                    builder.persist(objName, propName, adapted.adaptedValue);
                }
            });
            return builder.build();
        }
    }
}

/**
 * Builds the enumeration objects for the given settings object
 */
export function buildEnumerationObjects(
    settingsObj: any, requestedObjectName: string, includeHidden = false): powerbi.VisualObjectInstance[] {
    "use strict";
    let instances = [{
        selector: null, // tslint:disable-line
        objectName: requestedObjectName,
        properties: {},
    }] as powerbi.VisualObjectInstance[];
    if (settingsObj) {
        const settingsMetadata = getSettingsMetadata(settingsObj);
        if (settingsMetadata) {
            Object.keys(settingsObj).forEach(key => {
                const setting = settingsMetadata[key];
                const { objName, propName } = getPBIObjectNameAndPropertyName(settingsObj);
                const isSameCategory = objName === requestedObjectName;
                if (isSameCategory) {
                    const adapted = convertValueToPBI(settingsObj, setting, includeHidden);
                    if (adapted) {
                        instances[0].properties[propName] = adapted.adaptedValue;
                    }
                }
            });
        }
    }
    return instances;
}

/**
 * Builds the capabilities objects dynamically from a settings class
 */
export function buildCapabilitiesObjects<T>(settingsCtor: any): powerbi.data.DataViewObjectDescriptors {
    "use strict";
    let objects: powerbi.data.DataViewObjectDescriptors;
    if (settingsCtor) {
        const settingsMetadata = getSettingsMetadata(settingsCtor);
        if (settingsMetadata) {
            objects = {};
            Object.keys(settingsMetadata).map(key => {
                const { descriptor, propertyName } = settingsMetadata[key];
                const { objName, propName } = getPBIObjectNameAndPropertyName(settingsMetadata[key]);
                let { category, name, displayName, defaultValue, config, description, persist } = descriptor;
                if (persist !== false) {
                    const catObj = objects[objName] = objects[objName] || {
                        displayName: category,
                        properties: {},
                    };
                    let type: powerbi.data.DataViewObjectPropertyTypeDescriptor;
                    if (typeof defaultValue === "number") {
                        type = { numeric: true };
                    } else if (typeof defaultValue === "boolean") {
                        type = { bool: true };
                    } else if (typeof defaultValue === "string") {
                        type = { text: {} };
                    }
                    config = config || <any>{};
                    const finalObj: powerbi.data.DataViewObjectPropertyDescriptor = {
                        displayName: config.displayName || displayName || propName,
                        description: config.description || description,
                        type: config.type || type,
                    };
                    if (config.rule) {
                        finalObj.rule = config.rule;
                    }

                    debug.assert(!!finalObj.type, `Could not infer type property for ${propertyName}, manually add it via pbiConfig`);

                    catObj.properties[propName] = finalObj;
                }
            });
        }
    }
    return objects;
}

/**
 * Gets the settings metadata from the given object
 */
function getSettingsMetadata(obj: any): { [key: string]: ISetting } {
    "use strict";
    let metadata: any;
    if (obj) {
        metadata = obj[METADATA_KEY];
        if (!metadata && obj.constructor) {
            metadata = obj.constructor[METADATA_KEY];
        }
    }
    return metadata;
}

/**
 * Gets the appropriate object name and property name for powerbi from the given descriptor
 */
function getPBIObjectNameAndPropertyName(setting: ISetting) {
    "use strict";
    const { propertyName, descriptor: { name, category } } = setting;
    return {
        objName: category.toLowerCase(),
        propName: name ? name.toLowerCase() : propertyName,
    };
}

/**
 * Converts the value for the given setting on the object to a powerbi compatible value
 */
function convertValueToPBI(obj: any, setting: ISetting, includeHidden: boolean = false) {
    "use strict";
    const { descriptor, propertyName: fieldName } = setting;
    const { hidden, persist, compose } = descriptor;
    // Ignore ones that are "hidden" and ones that shouldn't be "persisted"
    if ((includeHidden || !hidden) && persist !== false) {
        let value = obj[fieldName];
        if (compose) {
            value = compose(value, descriptor);
        }
        return {
            adaptedValue: value,
        };
    }
}

/**
 * Converts the value for the given setting in PBI to a regular setting value
 */
function convertValueFromPBI(setting: ISetting, options: powerbi.VisualUpdateOptions) {
    "use strict";
    const objects: powerbi.DataViewObjects = ldget(options, "dataViews[0].metadata.objects");
    const { descriptor, descriptor: { category, defaultValue, parse }, propertyName } = setting;
    const { objName, propName } = getPBIObjectNameAndPropertyName(setting);
    let value = ldget(objects, `${objName}.${propName}`, defaultValue);
    if (parse) {
        value = parse(value, descriptor, options);
    }
    return {
        adaptedValue: value,
    };
}

/**
 * Represents a setting
 */
export interface ISetting {
    /** 
     * The property name within the class that this setting is for
     */
    propertyName: string;

    /**
     * The setting descriptor
     */
    descriptor: ISettingDescriptor;
}

/**
 * The setting descriptor
 */
export interface ISettingDescriptor {

    /**
     * The display name of the setting
     */
    displayName?: string;

    /**
     * The settings description
     */
    description?: string;

    /**
     * The category of the setting
     */
    category: string;

    /**
     * The default value for this setting
     */
    defaultValue?: any;

    /**
     * If hidden, the setting will not show up in powerbi's formatting pane
     * @default false
     */
    hidden?: boolean;

    /**
     * Whether or not this setting should be persisted to powerbi
     */
    persist?: boolean;

    /**
     * Additional configuration options
     */
    config?: powerbi.data.DataViewObjectPropertyDescriptor;

    /**
     * The name of the setting
     */
    name?: string;

    /**
     * A helper to parse the powerbi value into a setting value
     */
    parse?: (
        /**
         * The PowerBI version of the value
         */
        pbiValue: any,

        /**
         * The descriptor that is requesting the value
         */
        descriptor?: ISettingDescriptor,

        /**
         * The options used for parsing
         */
        options?: powerbi.VisualUpdateOptions) => any; // Controls how the value is parsed from pbi

    /**
     * A helper to convert the setting value into a powerbi value
     */
    compose?: (value: any, descriptor?: ISettingDescriptor) => any; // Controls how the value is returned to pbi
}

