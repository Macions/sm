
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: number;
    success: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
}


export interface MonthlyRevenue {
    month: string;
    year: number;
    revenue: number;
    expenses?: number;
    profit?: number;
}

export interface RevenueData {
    year: number;
    months: MonthlyRevenue[];
    totalRevenue: number;
    averageRevenue: number;
}