#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './components/App.js';
import { getVersion, getFullVersionInfo } from './utils/version.js';
const cli = meow(`
  Usage
    $ bookr [time] [options]

  Arguments
    time    Time to log (e.g., "2h 30m", "1h15m", "45m")

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
  `, {
    importMeta: import.meta,
    flags: {
        version: {
            type: 'boolean',
            shortFlag: 'v',
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
// Handle version flag
if (flags.version) {
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
//# sourceMappingURL=cli.js.map