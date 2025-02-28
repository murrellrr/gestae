

import { describe, it } from "mocha";
import assert from "assert/strict";
import { 
    GestaeReflectKey, 
    getClassConfig, 
    getInstanceConfig, 
    getConfig, 
    setClassConfig, 
    setInstanceConfig 
} from "../src/Gestae";

class TestClass {
    someProperty: string = "test";
}

describe("Gestae Reflect Metadata Functions", () => {
    // it("getClassConfig should return an empty object if no metadata is set", () => {
    //     const config = getClassConfig(TestClass, GestaeReflectKey.resource);
    //     assert.deepStrictEqual(config, {}); 
    // });

    // it("setClassConfig should define metadata for a class", () => {
    //     const mockConfig = { foo: "bar" };
    //     setClassConfig(TestClass, GestaeReflectKey.resource, mockConfig);

    //     const config = getClassConfig(TestClass, GestaeReflectKey.resource);
    //     assert.deepStrictEqual(config, mockConfig); 
    // });

    // it("getInstanceConfig should return an empty object if no metadata is set", () => {
    //     let testInstance: TestClass = new TestClass();
    //     const config = getInstanceConfig(testInstance, GestaeReflectKey.task);
    //     assert.deepStrictEqual(config, {}); 
    // });

    // it("setInstanceConfig should define metadata for an instance", () => {
    //     let testInstance: TestClass = new TestClass();
    //     const mockConfig = { taskName: "exampleTask" };
    //     setInstanceConfig(testInstance, GestaeReflectKey.task, mockConfig);

    //     const config = getInstanceConfig(testInstance, GestaeReflectKey.task);
    //     assert.deepStrictEqual(config, mockConfig); 
    // });

    it("getConfig should merge class and instance metadata", () => {
        let testInstance: TestClass = new TestClass();
        const classConfig = { classKey: "classValue" };
        const instanceConfig = { instanceKey: "instanceValue" };

        setClassConfig(TestClass, GestaeReflectKey.namespace, classConfig);
        setInstanceConfig(testInstance, GestaeReflectKey.namespace, instanceConfig);

        const mergedConfig = getConfig(testInstance, GestaeReflectKey.namespace);
        assert.deepStrictEqual(mergedConfig, { ...classConfig, ...instanceConfig }); 
    });
});