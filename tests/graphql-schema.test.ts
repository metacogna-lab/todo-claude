import { describe, it, expect } from "vitest";
import { GraphQLObjectType, GraphQLInputObjectType } from "graphql";
import { schema } from "../src/graphql/schema.js";
import { TaskSchema } from "../src/schema/task.js";
import { IntegrationProfileSchema } from "../src/schema/integrationProfile.js";

describe("GraphQL schema parity", () => {
  it("exposes Task fields that mirror the Zod contract", () => {
    const taskType = schema.getType("Task");
    expect(taskType).toBeInstanceOf(GraphQLObjectType);
    const fieldNames = Object.keys((taskType as GraphQLObjectType).getFields()).sort();
    const zodFields = Object.keys(TaskSchema.shape).sort();
    expect(fieldNames).toEqual(expect.arrayContaining(zodFields));
  });

  it("exposes IntegrationProfile fields that mirror the Zod contract", () => {
    const profileType = schema.getType("IntegrationProfile");
    expect(profileType).toBeInstanceOf(GraphQLObjectType);
    const fieldNames = Object.keys((profileType as GraphQLObjectType).getFields()).sort();
    const zodFields = Object.keys(IntegrationProfileSchema.shape).sort();
    // GraphQL omits internal status computation fields like updatedAt being required, but superset should hold.
    expect(fieldNames).toEqual(expect.arrayContaining(zodFields));
  });

  it("requires captureThought input fields", () => {
    const inputType = schema.getType("CaptureThoughtInput");
    expect(inputType).toBeInstanceOf(GraphQLInputObjectType);
    const fieldNames = Object.keys((inputType as GraphQLInputObjectType).getFields()).sort();
    expect(fieldNames).toEqual(["dryRun", "labels", "text"]);
  });
});
