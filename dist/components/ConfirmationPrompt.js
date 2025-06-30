import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { formatTimeForDisplay } from '../utils/time-parser.js';
export const ConfirmationPrompt = ({ issue, timeSpent, description, onConfirm, onCancel }) => {
    const [selectedOption, setSelectedOption] = useState('confirm');
    useInput((input, key) => {
        if (key.upArrow || key.downArrow) {
            setSelectedOption(prev => prev === 'confirm' ? 'cancel' : 'confirm');
        }
        else if (key.return) {
            if (selectedOption === 'confirm') {
                onConfirm();
            }
            else {
                onCancel();
            }
        }
        else if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
            if (input.toLowerCase() === 'y') {
                onConfirm();
            }
            else {
                onCancel();
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "cyan", bold: true, children: "\uD83D\uDCCB Confirm Worklog Entry" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Issue:" }), " ", issue.key, " - ", issue.fields.summary] }), _jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Project:" }), " ", issue.fields.project.name] }), _jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Status:" }), " ", issue.fields.status.name] }), _jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Time:" }), " ", formatTimeForDisplay(timeSpent), " (", timeSpent, ")"] }), description && (_jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: "Description:" }), " ", description] }))] }), _jsxs(Box, { marginTop: 2, flexDirection: "column", children: [_jsx(Text, { color: "gray", children: "Use \u2191\u2193 arrows to select, Enter to confirm, or type y/n" }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: selectedOption === 'confirm' ? 'green' : 'gray', children: selectedOption === 'confirm' ? '► ' : '  ' }), _jsx(Text, { color: selectedOption === 'confirm' ? 'green' : 'gray', children: "\u2705 Confirm and create worklog" })] }), _jsxs(Box, { children: [_jsx(Text, { color: selectedOption === 'cancel' ? 'red' : 'gray', children: selectedOption === 'cancel' ? '► ' : '  ' }), _jsx(Text, { color: selectedOption === 'cancel' ? 'red' : 'gray', children: "\u274C Cancel" })] })] })] }));
};
//# sourceMappingURL=ConfirmationPrompt.js.map