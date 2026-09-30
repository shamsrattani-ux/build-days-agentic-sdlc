import {
  createFeedbackSchema,
  feedbackListQuerySchema,
  fieldLimits,
  voteRequestSchema,
} from "../src/shared/contracts.js";

describe("feedback contracts", () => {
  it("normalizes valid feedback", () => {
    expect(
      createFeedbackSchema.parse({
        title: "  Clear examples  ",
        description: "  Add examples  ",
        category: "content",
        displayName: "  Ada  ",
      }),
    ).toEqual({
      title: "Clear examples",
      description: "Add examples",
      category: "content",
      displayName: "Ada",
    });
  });

  it("rejects missing and oversized fields", () => {
    const result = createFeedbackSchema.safeParse({
      title: "x".repeat(fieldLimits.title + 1),
      description: "",
      category: "unknown",
      displayName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "title",
          "description",
          "category",
          "displayName",
        ]),
      );
    }
  });

  it("accepts workshop-safe client identifiers only", () => {
    expect(voteRequestSchema.safeParse({ clientId: "client_123-abc" }).success).toBe(
      true,
    );
    expect(voteRequestSchema.safeParse({ clientId: "not/valid" }).success).toBe(
      false,
    );
  });
});

describe("feedback list query contract", () => {
  it("defaults a missing category to all", () => {
    expect(feedbackListQuerySchema.parse({})).toEqual({ category: "all" });
  });

  it("parses each existing category unchanged", () => {
    for (const category of ["content", "facilitation", "tooling", "idea"]) {
      expect(feedbackListQuerySchema.parse({ category })).toEqual({ category });
    }
  });

  it("rejects an unsupported category value", () => {
    expect(feedbackListQuerySchema.safeParse({ category: "unsupported" }).success).toBe(
      false,
    );
  });
});
