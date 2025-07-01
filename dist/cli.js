#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './components/App.js';
import { getVersion, getFullVersionInfo } from './utils/version.js';
async function main() {
    const cli = meow(`
    Usage
      $ bookr [time] [options]
      $ bookr today
      $ bookr sprint

    Arguments
      time    Time to log (e.g., "2h 30m", "1h15m", "45m")
      today   Show today's worklogs and total hours
      sprint  Show worklogs for the last 14 days (sprint period)

    Options
      --help, -h        Show help
      --version, -v     Show version
      --message, -m     Description of work done
      --date, -d        Date to log time for (YYYY-MM-DD)

    Examples
      $ bookr
      $ bookr 2h15m
      $ bookr 1h30m -m "Fixed bug in login"
      $ bookr 45m --message "Code review"
      $ bookr --date "2024-01-15" 4h
      $ bookr today
      $ bookr sprint
    `, {
        importMeta: import.meta,
        version: false,
        flags: {
            dev: {
                type: 'boolean',
                shortFlag: 'd',
            },
            message: {
                type: 'string',
                shortFlag: 'm',
            },
            date: {
                type: 'string',
                shortFlag: 'd',
            },
        },
    });
    const { input, flags } = cli;
    // Handle version flag (check both --version and --ver)
    if (flags.dev || process.argv.includes('--dev')) {
        const versionInfo = getFullVersionInfo();
        console.log(getVersion());
        // Show additional info in development
        if (versionInfo.commitHash) {
            console.log(`Commit: ${versionInfo.commitHash}`);
            if (versionInfo.branch) {
                console.log(`Branch: ${versionInfo.branch}`);
            }
            if (versionInfo.dirty) {
                console.log('Status: dirty (uncommitted changes)');
            }
        }
        process.exit(0);
    }
    // Handle "today" command
    if (input[0] === 'today') {
        // Import and run the today command
        await import('./today.js');
        return;
    }
    // Handle "sprint" command
    if (input[0] === 'sprint') {
        // Import and run the sprint command
        await import('./sprint.js');
        return;
    }
    // Handle "init" command
    if (input[0] === 'init') {
        await import('./init.js');
        return;
    }
    // Extract time from first positional argument
    const time = input[0];
    render(React.createElement(App, {
        input,
        flags: {
            ...flags,
            time,
            description: flags.message
        }
    }));
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map