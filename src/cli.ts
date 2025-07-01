#!/usr/bin/env node

import { render } from 'ink';
import meow from 'meow';
import React from 'react';
import { App } from './components/App.js';

async function main() {
  const cli = meow(
    `
    Usage
      $ bookr [ticket] [time] [options]
      $ bookr [time] [options]
      $ bookr today
      $ bookr sprint

    Arguments
      ticket  Jira ticket key (e.g., "PROJ-123") - optional, will use Git branch if not provided
      time    Time to log (e.g., "2h 30m", "1h15m", "45m")
      today   Show today's worklogs and total hours
      sprint  Show worklogs for the last 14 days (sprint period)

    Options
      --help, -h        Show help
      --version, -v     Show version
      --message, -m     Description of work done
      --date, -d        Date to log time for (YYYY-MM-DD)

    Examples
      $ bookr 2h15m                           # Use Git branch for ticket
      $ bookr PROJ-123 2h15m                  # Explicitly specify ticket
      $ bookr PROJ-123 1h30m -m "Fixed bug"   # With description
      $ bookr 45m --message "Code review"     # Use Git branch
      $ bookr --date "2024-01-15" 4h         # With specific date
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

  // Parse arguments to handle optional ticket parameter
  let ticket: string | undefined;
  let time: string | undefined;

  // Check if first argument looks like a ticket (contains a dash and number)
  if (input[0] && /^[A-Z]+-\d+$/.test(input[0])) {
    ticket = input[0];
    time = input[1];
  } else {
    time = input[0];
  }

  render(
    React.createElement(App, {
      input,
      flags: {
        ...flags,
        ticket,
        time,
        description: flags.message,
      },
    })
  );
}

main().catch(console.error);
