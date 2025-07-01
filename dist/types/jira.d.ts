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
        assignee?: {
            name: string;
            displayName: string;
        };
    };
}
export interface JiraWorklog {
    id?: string;
    timeSpent: string;
    timeSpentSeconds?: number;
    comment?: string | {
        content: Array<{
            content: Array<{
                text: string;
                type: string;
            }>;
            type: string;
        }>;
        type: string;
        version: number;
    };
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
export interface JiraSprint {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
}
//# sourceMappingURL=jira.d.ts.map