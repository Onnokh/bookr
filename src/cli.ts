#!/usr/bin/env node

import { render } from 'ink';
import meow from 'meow';
import React from 'react';
import { App } from './components/App.js';

async function main() {
  const cli = meow(
    `
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
    `,
    {
      importMeta: import.meta,
      flags: {
        message: {
          type: 'string',
          shortFlag: 'm',
        },
        date: {
          type: 'string',
          shortFlag: 'd',
        },
        version: {
          type: 'boolean',
          shortFlag: 'v',
        },
      },
    }
  );

  const { input, flags } = cli;

  // Handle "today" command
  if (input[0] === 'today') {
    const command = await import('./commands/today.js');
    await command.default();
    return;
  }

  // Handle "sprint" command
  if (input[0] === 'sprint') {
    const command = await import('./commands/sprint.js');
    await command.default();
    return;
  }

  // Handle "init" command
  if (input[0] === 'init') {
    const command = await import('./commands/init.js');
    await command.default();
    return;
  }

  // Extract time from first positional argument
  const time = input[0];

  render(
    React.createElement(App, {
      input,
      flags: {
        ...flags,
        time,
        description: flags.message,
      },
    })
  );
}

main().catch(console.error);
