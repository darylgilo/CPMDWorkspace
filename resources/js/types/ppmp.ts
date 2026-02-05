export interface Timeline {
    start_procurement: string;
    end_procurement: string;
    delivery_period: string;
}

export interface FundingDetail {
    id: number;
    ppmp_project_id: number;
    quantity_size: string;
    mode_of_procurement: string;
    pre_procurement_conference: string;
    estimated_budget: string | number;
    supporting_documents: string;
    remarks: string;
    timelines: Timeline[];
    source_of_funds?: string;
}

export interface PPMPProject {
    id: number;
    fund_id: number;
    general_description: string;
    project_type: string;
    category?: string;
    created_at?: string;
    funding_details?: FundingDetail[];
    fund?: Fund;
}

export interface Fund {
    id: number;
    fund_name: string;
    fund_code?: string;
    source_year?: number;
    total_amount?: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page?: number;
    last_page?: number;
    total?: number;
}
