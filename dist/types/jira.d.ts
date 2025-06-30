export interface JiraAuth {
    baseUrl: string;
    email: string;
    apiToken: string;
}
export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        description?: string;
        status: {
            name: string;
        };
        project: {
            key: string;
            name: string;
        };
    };
}
export interface JiraWorklog {
    id?: string;
    timeSpent: string;
    timeSpentSeconds?: number;
    comment?: string;
    started?: string;
    author?: {
        name: string;
        displayName: string;
    };
    visibility?: {
        type: string;
        value: string;
    };
}
export interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress: string;
    active: boolean;
}
export interface JiraError {
    errorMessages: string[];
    errors: Record<string, string>;
}
//# sourceMappingURL=jira.d.ts.map