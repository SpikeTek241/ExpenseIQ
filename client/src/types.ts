export interface Budget {
    id: number;
    category: string;
    limit: number;
    month: string;
}

export interface Transaction {
    id: number;
    merchant: string;
    amount: number;
    category: string;
    createdAt: string;
}

export interface InsightsResponse {
    insights: string[];
}