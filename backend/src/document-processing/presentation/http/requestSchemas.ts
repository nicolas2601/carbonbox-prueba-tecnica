export const PAGINATION_QUERY = { type: "object", properties: { page: { type: "number" }, limit: { type: "number" } } } as const;
export const ID_PARAMS = { type: "object", required: ["id"], properties: { id: { type: "string", minLength: 1 } } } as const;
