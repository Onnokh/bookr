import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { createJiraClientFromEnv } from '../api/jira-client.js';
import { getCurrentBranch, extractJiraIssueKey, isGitRepository } from '../utils/git.js';
import { parseTimeToSeconds, isValidTimeFormat, formatTimeForDisplay, secondsToJiraFormat, formatJiraDate } from '../utils/time-parser.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';
export const App = ({ input: _input, flags }) => {
    const [currentBranch, setCurrentBranch] = useState('Loading...');
    const [jiraIssue, setJiraIssue] = useState(null);
    const [appState, setAppState] = useState('loading');
    const [error, setError] = useState(null);
    const [timeSpent, setTimeSpent] = useState('');
    useEffect(() => {
        async function initialize() {
            try {
                // Check if we're in a Git repository
                if (!isGitRepository()) {
                    setError('Not in a Git repository. Please run this command from a Git repository.');
                    setAppState('error');
                    return;
                }
                // Get current Git branch
                const branch = getCurrentBranch();
                setCurrentBranch(branch);
                // Check if time was provided
                if (!flags.time) {
                    setError('No time specified. Please provide time (e.g., "2h30m", "1h15m", "45m")');
                    setAppState('error');
                    return;
                }
                // Validate time format
                if (!isValidTimeFormat(flags.time)) {
                    setError(`Invalid time format: "${flags.time}". Use formats like "2h30m", "1h15m", "45m", "2.5h"`);
                    setAppState('invalid-time');
                    return;
                }
                setTimeSpent(flags.time);
                // Try to extract JIRA issue key from branch name
                const issueKey = extractJiraIssueKey(branch);
                if (!issueKey) {
                    setAppState('no-issue');
                    return;
                }
                try {
                    const client = createJiraClientFromEnv();
                    const issue = await client.getIssue(issueKey);
                    setJiraIssue(issue);
                    setAppState('confirm');
                }
                catch (jiraError) {
                    setError(`Could not fetch JIRA issue ${issueKey}: ${jiraError instanceof Error ? jiraError.message : 'Unknown error'}`);
                    setAppState('error');
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setAppState('error');
            }
        }
        initialize();
    }, [flags.time]);
    const handleConfirm = async () => {
        if (!jiraIssue || !timeSpent)
            return;
        setAppState('creating');
        try {
            const client = createJiraClientFromEnv();
            const timeSpentSeconds = parseTimeToSeconds(timeSpent);
            await client.addWorklog(jiraIssue.key, {
                timeSpent: secondsToJiraFormat(timeSpentSeconds),
                comment: flags.description || `Work logged via Bookr CLI`,
                started: formatJiraDate(new Date())
            });
            setAppState('success');
        }
        catch (error) {
            setError(`Failed to create worklog: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setAppState('error');
        }
    };
    const handleCancel = () => {
        setAppState('cancelled');
    };
    // Loading state
    if (appState === 'loading') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "\u23F3 Loading..." }) })] }));
    }
    // Error state
    if (appState === 'error') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsxs(Text, { color: "red", children: ["\u274C Error: ", error] })] }));
    }
    // Invalid time format
    if (appState === 'invalid-time') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsxs(Text, { color: "red", children: ["\u274C ", error] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "yellow", children: "Valid time formats:" }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: "  \u2022 2h30m (2 hours 30 minutes)" }), _jsx(Text, { children: "  \u2022 1h15m (1 hour 15 minutes)" }), _jsx(Text, { children: "  \u2022 45m (45 minutes)" }), _jsx(Text, { children: "  \u2022 2.5h (2.5 hours)" }), _jsx(Text, { children: "  \u2022 90m (90 minutes)" })] })] }));
    }
    // No JIRA issue found
    if (appState === 'no-issue') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Text, { children: "Welcome to Bookr! A CLI tool to book time in Jira using Tempo." }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "yellow", children: ["Current branch: ", currentBranch] }) }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "blue", children: ["\u23F1\uFE0F  Time to log: ", formatTimeForDisplay(timeSpent), " (", timeSpent, ")"] }) }), flags.description && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "blue", children: ["\uD83D\uDCDD Description: ", flags.description] }) })), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: "yellow", children: ["\u26A0\uFE0F  No JIRA issue key found in branch name \"", currentBranch, "\""] }), _jsx(Text, { color: "gray", children: "Expected format: feature/PROJ-123, bugfix/PROJ-456, etc." })] })] }));
    }
    // Confirmation state
    if (appState === 'confirm' && jiraIssue) {
        return (_jsx(ConfirmationPrompt, { issue: jiraIssue, timeSpent: timeSpent, description: flags.description || undefined, onConfirm: handleConfirm, onCancel: handleCancel }));
    }
    // Creating worklog state
    if (appState === 'creating') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "\u23F3 Creating worklog..." }) })] }));
    }
    // Success state
    if (appState === 'success' && jiraIssue) {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "green", bold: true, children: "\u2705 Worklog created successfully!" }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Issue:" }), " ", jiraIssue.key, " - ", jiraIssue.fields.summary] }), _jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Time:" }), " ", formatTimeForDisplay(timeSpent), " (", timeSpent, ")"] }), flags.description && (_jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Description:" }), " ", flags.description] }))] })] }));
    }
    // Cancelled state
    if (appState === 'cancelled') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "yellow", children: "\u274C Worklog creation cancelled" }) })] }));
    }
    // Fallback
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Text, { children: "Unknown state" })] }));
};
//# sourceMappingURL=App.js.map