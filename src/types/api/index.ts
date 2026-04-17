export type { ApiResponse } from "@/lib/api/response";

import type { ApiResponse } from "@/lib/api/response";

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServerActionResult<T> = ApiResponse<T>;
