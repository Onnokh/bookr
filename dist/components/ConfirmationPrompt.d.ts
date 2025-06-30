import React from 'react';
import { JiraIssue } from '../types/jira.js';
interface ConfirmationPromptProps {
    issue: JiraIssue;
    timeSpent: string;
    description?: string | undefined;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare const ConfirmationPrompt: React.FC<ConfirmationPromptProps>;
export {};
//# sourceMappingURL=ConfirmationPrompt.d.ts.map