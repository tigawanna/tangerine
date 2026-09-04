/** Flat list metadata used by some public list responses. */
export type IdealListResponseMetadata = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  status: "success";
};
