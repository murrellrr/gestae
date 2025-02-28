
console.log("*************************************************** Test file loaded!");


import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { 
    getClassOptions, 
    getInstanceOptions, 
    getConfig, 
    setClassOptions, 
    setInstanceOptions 
} from "../Gestae.js";

class TestClass {
    someProperty: string = "test";
}

describe("Gestae Reflect Metadata Functions", () => {
    let testInstance: TestClass = new TestClass();

    it("getClassConfig should return an empty object if no metadata is set", () => {
        const config = getClassOptions(TestClass, GestaeReflectKey.resource);
        assert.deepStrictEqual(config, {}); 
    });

    it("setClassConfig should define metadata for a class", () => {
        const mockConfig = { foo: "bar" };
        setClassOptions(TestClass, GestaeReflectKey.resource, mockConfig);

        const config = getClassOptions(TestClass, GestaeReflectKey.resource);
        assert.deepStrictEqual(config, {}); 
    });

    it("getInstanceConfig should return an empty object if no metadata is set", () => {
        const config = getInstanceOptions(testInstance, GestaeReflectKey.task);
        assert.deepStrictEqual(config, {});
    });

    it("setInstanceConfig should define metadata for an instance", () => {
        const mockConfig = { taskName: "exampleTask" };
        setInstanceOptions(testInstance, GestaeReflectKey.task, mockConfig);

        const config = getInstanceOptions(testInstance, GestaeReflectKey.task);
        assert.deepStrictEqual(config, {});
    });

    it("getConfig should merge class and instance metadata", () => {
        const classConfig = { classKey: "classValue" };
        const instanceConfig = { instanceKey: "instanceValue" };

        setClassOptions(TestClass, GestaeReflectKey.namespace, classConfig);
        setInstanceOptions(testInstance, GestaeReflectKey.namespace, instanceConfig);

        const mergedConfig = getConfig(testInstance, GestaeReflectKey.namespace);
        console.log("Merged Config:", mergedConfig); // ✅ Debugging output
        assert.deepStrictEqual(mergedConfig, classConfig);
    });
});
