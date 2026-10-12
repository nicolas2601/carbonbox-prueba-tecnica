export const PAGINATION_QUERY = { type: "object", properties: { page: { type: "number" }, limit: { type: "number" } } } as const;
export const UPLOAD_LIST_QUERY = { type: "object", properties: {
  page: { type: "number" }, limit: { type: "number" },
  q: { type: "string", pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f]*$",
    description: "Trimmed search text, up to 200 characters; control characters are rejected." },
  status: { type: "string", enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] },
  sort: { type: "string", enum: ["newest", "oldest", "name"] },
} } as const;
export const ID_PARAMS = { type: "object", required: ["id"], properties: { id: { type: "string", minLength: 1 } } } as const;
