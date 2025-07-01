# Worklog Undo Implementation

This document describes the implementation of local worklog storage and undo functionality for the bookr CLI tool.

## Overview

The implementation adds the ability to:
1. Locally store created worklogs for tracking and enhanced display
2. Display ALL worklog IDs in the `bookr today` command  
3. Undo (delete) ANY worklog by ID via `bookr undo` command
4. Smart worklog discovery across recent time periods

## Features Implemented

### 1. Local Worklog Storage (`src/utils/worklog-storage.ts`)

- **Storage Location**: Uses `env-paths` to store data in the user's data directory
- **File**: `~/.local/share/bookr-cli/worklogs.json` (Linux) or equivalent on other platforms
- **Data Structure**: Stores worklog metadata including ID, issue details, time, and creation date
- **Automatic Cleanup**: Removes worklogs older than 30 days to prevent unlimited growth
- **Capacity Limit**: Keeps only the last 100 worklogs to prevent excessive storage usage

### 2. Enhanced Today Command

The `bookr today` command now displays:
- **Worklog IDs**: Shows the JIRA worklog ID for each entry
- **Source Indicator**: Marks worklogs created via bookr as "(bookr)" for easy identification
- **Improved Formatting**: Tabular display with columns for ID, Issue, Time, and Summary
- **Comment Display**: Shows worklog comments with proper indentation
- **Universal Undo**: ALL worklogs shown can be undone using their ID

**Example Output:**
```
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ID                | Issue        | Time     | Summary
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
12345 (bookr)    | PROJ-123     | 2h 30m   | Fix authentication bug in user login
                                             └─ Fixed OAuth token validation issue
67890            | PROJ-456     | 1h       | Code review for feature X
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
```

### 3. Undo Command (`src/commands/undo.ts`)

Two usage modes:

#### Interactive Mode: `bookr undo`
- Shows a table of today's worklogs that can be undone
- Displays worklog ID, issue, time, summary, and source (bookr vs other)
- Shows ALL worklogs from today, not just those created via bookr CLI
- Provides instructions for undoing specific worklogs

#### Direct Mode: `bookr undo <WORKLOG_ID>`
- Deletes ANY worklog by its JIRA ID (if you have permission)
- Searches recent worklogs (7 days) to find details before deletion
- Shows worklog details before deletion for confirmation
- Removes the worklog from both JIRA and local storage (if stored locally)
- Works with any valid JIRA worklog ID, regardless of how it was created

### 4. JIRA API Enhancement (`src/api/jira-client.ts`)

Added `deleteWorklog` method:
- Sends DELETE request to JIRA REST API
- Handles authentication and error responses
- Provides detailed error messages for debugging

### 5. App Component Integration (`src/components/App.tsx`)

Modified worklog creation flow:
- Stores worklog metadata locally after successful JIRA creation
- Preserves original comment text for storage
- Handles storage failures gracefully without blocking worklog creation

## Usage Examples

### Creating a Worklog (Enhanced)
```bash
bookr PROJ-123 2h30m -m "Fixed authentication bug"
# ✅ Worklog created and stored locally for potential undo
```

### Viewing Today's Worklogs with IDs
```bash
bookr today
# Shows all today's worklogs with IDs and indicates which can be undone
```

### Interactive Undo
```bash
bookr undo
# Shows table of today's worklogs with IDs and source indicators
```

### Direct Undo
```bash
bookr undo 12345
# Deletes any worklog with JIRA ID 12345 (searches recent worklogs for details)
```

## Technical Implementation Details

### Storage Format
```json
{
  "worklogs": [
    {
      "id": "12345",
      "issueKey": "PROJ-123",
      "issueId": "10001",
      "issueSummary": "Fix authentication bug",
      "timeSpent": "2h30m",
      "timeSpentSeconds": 9000,
      "comment": "Fixed OAuth token validation",
      "started": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "author": {
        "name": "john.doe",
        "displayName": "John Doe"
      }
    }
  ],
  "lastCleanup": "2024-01-15T00:00:00.000Z"
}
```

### Error Handling

The implementation includes comprehensive error handling for:
- **Storage Failures**: Graceful degradation if local storage fails
- **JIRA API Errors**: Detailed error messages for API failures
- **Missing Worklogs**: Clear feedback when worklog IDs aren't found
- **Permission Issues**: Informative messages for insufficient permissions

### Security Considerations

- **Local Storage Only**: Worklog metadata stored locally, no external transmission
- **Permission Respect**: Only allows deletion of user's own worklogs via JIRA API
- **Data Validation**: Validates worklog IDs and existence before deletion attempts

## CLI Command Updates

Updated help text and command structure:

```
Usage
  $ bookr [ticket] [time] [options]
  $ bookr [time] [options]
  $ bookr today
  $ bookr sprint
  $ bookr undo [worklog_id]

Arguments
  ticket     Jira ticket key (e.g., "PROJ-123") - optional, will use Git branch if not provided
  time       Time to log (e.g., "2h 30m", "1h15m", "45m")
  today      Show today's worklogs and total hours with IDs
  sprint     Show worklogs for the last 14 days (sprint period)
  undo       Delete recent worklogs (interactive) or specific worklog by ID

Examples
  $ bookr today                               # View today's worklogs with IDs
  $ bookr undo                                # Show today's worklogs that can be undone
  $ bookr undo 12345                          # Undo any worklog by its JIRA ID
```

## Benefits

1. **Universal Undo**: Can undo ANY worklog by ID, not just those created via bookr CLI
2. **Safety Net**: Provides ability to undo accidental or incorrect worklog entries  
3. **Transparency**: Shows clear worklog IDs for easy reference
4. **User-Friendly**: Interactive mode for discovering all available worklogs
5. **Efficient**: Direct mode for quick undo operations with any valid worklog ID
6. **Non-Intrusive**: Doesn't affect existing functionality or performance
7. **Reliable**: Robust error handling and graceful degradation

## Future Enhancements

Potential improvements for future versions:
- Confirmation prompts for deletion in direct mode
- Bulk undo operations
- Worklog editing (time/comment modification)
- Export/import of worklog history
- Integration with git commit history for automatic worklog suggestions