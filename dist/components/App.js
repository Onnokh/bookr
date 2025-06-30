import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const App = ({ input: _input, flags }) => {
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: "green", bold: true, children: "\uD83E\uDDEA Bookr - Tempo CLI Tool" }), _jsx(Text, { children: "Welcome to Bookr! A CLI tool to book time in Jira using Tempo." }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "yellow", children: ["Current branch: ", getCurrentBranch()] }) }), flags.time && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "blue", children: ["Time to log: ", flags.time] }) })), flags.description && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "blue", children: ["Description: ", flags.description] }) }))] }));
};
function getCurrentBranch() {
    try {
        // This is a placeholder - we'll implement proper Git integration later
        return 'feature/TEMP-123-add-cli-tool';
    }
    catch (error) {
        return 'unknown';
    }
}
//# sourceMappingURL=App.js.map