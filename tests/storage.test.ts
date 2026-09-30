import type { TableClient } from "@azure/data-tables";
import {
  AzureTableFeedbackStorage,
  FeedbackNotFoundError,
  InMemoryFeedbackStorage,
  seedStorage,
} from "../src/server/storage.js";

const input = {
  title: "Useful workshop",
  description: "Keep the live walkthrough.",
  category: "facilitation" as const,
  displayName: "Grace",
};

describe("in-memory feedback storage", () => {
  it("creates and lists newest feedback first", async () => {
    const storage = new InMemoryFeedbackStorage();
    await storage.create(input, {
      id: "older",
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    await storage.create(
      { ...input, title: "Newer" },
      { id: "newer", createdAt: "2025-01-02T00:00:00.000Z" },
    );

    expect((await storage.list()).map(({ id }) => id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("counts one vote per client and feedback item", async () => {
    const storage = new InMemoryFeedbackStorage();
    const feedback = await storage.create(input);

    const first = await storage.vote(feedback.id, "client-1");
    const duplicate = await storage.vote(feedback.id, "client-1");
    const secondClient = await storage.vote(feedback.id, "client-2");

    expect(first).toMatchObject({ alreadyVoted: false, feedback: { votes: 1 } });
    expect(duplicate).toMatchObject({
      alreadyVoted: true,
      feedback: { votes: 1 },
    });
    expect(secondClient.feedback.votes).toBe(2);
  });

  it("reports missing feedback", async () => {
    const storage = new InMemoryFeedbackStorage();
    await expect(storage.vote("missing", "client-1")).rejects.toBeInstanceOf(
      FeedbackNotFoundError,
    );
  });

  it("seeds deterministic data idempotently", async () => {
    const storage = new InMemoryFeedbackStorage();
    await seedStorage(storage);
    await seedStorage(storage);
    expect(await storage.list()).toHaveLength(2);
  });

  it("filters listed feedback by category", async () => {
    const storage = new InMemoryFeedbackStorage();
    await storage.create(input, { id: "facilitation-1" });
    await storage.create(
      { ...input, category: "content" },
      { id: "content-1" },
    );

    expect((await storage.list({ category: "facilitation" })).map(({ id }) => id)).toEqual([
      "facilitation-1",
    ]);
    expect(await storage.list({ category: "tooling" })).toEqual([]);
    expect(await storage.list()).toHaveLength(2);
  });
});

describe("Azure Table feedback storage", () => {
  it("records the vote marker and counter in one transaction", async () => {
    const table = {
      getEntity: vi.fn().mockResolvedValue({
        partitionKey: "feedback-1",
        rowKey: "feedback",
        title: input.title,
        description: input.description,
        category: input.category,
        displayName: input.displayName,
        votes: 2,
        createdAt: "2025-01-01T00:00:00.000Z",
        etag: "etag-1",
      }),
      submitTransaction: vi.fn().mockResolvedValue({}),
    };
    const storage = new AzureTableFeedbackStorage(
      table as unknown as TableClient,
    );

    const result = await storage.vote("feedback-1", "client-1");

    expect(result).toMatchObject({
      alreadyVoted: false,
      feedback: { votes: 3 },
    });
    expect(table.submitTransaction).toHaveBeenCalledOnce();
    const actions = table.submitTransaction.mock.calls[0]?.[0];
    expect(actions).toHaveLength(2);
    expect(actions[0][0]).toBe("create");
    expect(actions[1]).toMatchObject(["update", { votes: 3 }, "Replace"]);
  });

  it("reports an existing Azure vote without increasing the count", async () => {
    const table = {
      getEntity: vi.fn().mockResolvedValue({
        partitionKey: "feedback-1",
        rowKey: "feedback",
        title: input.title,
        description: input.description,
        category: input.category,
        displayName: input.displayName,
        votes: 2,
        createdAt: "2025-01-01T00:00:00.000Z",
        etag: "etag-1",
      }),
      submitTransaction: vi.fn().mockRejectedValue({ statusCode: 409 }),
    };
    const storage = new AzureTableFeedbackStorage(
      table as unknown as TableClient,
    );

    await expect(storage.vote("feedback-1", "client-1")).resolves.toMatchObject({
      alreadyVoted: true,
      feedback: { votes: 2 },
    });
  });

  it("includes the category in the odata filter when listing by category", async () => {
    const table = {
      listEntities: vi.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {},
      }),
    };
    const storage = new AzureTableFeedbackStorage(
      table as unknown as TableClient,
    );

    await storage.list({ category: "tooling" });

    expect(table.listEntities).toHaveBeenCalledOnce();
    const call = table.listEntities.mock.calls[0]?.[0];
    const { queryOptions } = call ?? {};
    expect(queryOptions?.filter).toContain("category eq 'tooling'");
  });

  it("omits the category clause when listing without a filter", async () => {
    const table = {
      listEntities: vi.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {},
      }),
    };
    const storage = new AzureTableFeedbackStorage(
      table as unknown as TableClient,
    );

    await storage.list();

    const call = table.listEntities.mock.calls[0]?.[0];
    const { queryOptions } = call ?? {};
    expect(queryOptions?.filter).not.toContain("category");
  });
});
