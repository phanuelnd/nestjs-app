export class FindBuildingsQueryDto {
  page?: number = 1;
  limit?: number = 20;
  sortBy?: string = 'id';
  sortDirection?: 'ASC' | 'DESC' = 'ASC';
  search?: string;
  statusFilter?: string;
  parcelIdFilter?: string;
  permitIdFilter?: string;
  dateFrom?: string;
  dateTo?: string;
} 