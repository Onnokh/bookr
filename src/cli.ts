#!/usr/bin/env node

import { render } from 'ink';
import meow from 'meow';
import React from 'react';
import { App } from './components/App.js';
import { showUpdateNotification } from './utils/update.js';

async function main() {
  // Show update notification (non-blocking)
  showUpdateNotification().catch(() => {
    // Silently fail update notifications
  });

  const cli = meow(
    `
    Usage
      $ bookr [ticket] [time] [options]
      $ bookr [time] [options]
      $ bookr today
      $ bookr sprint
      $ bookr progress
      $ bookr undo [worklog_id]
      $ bookr init
      $ bookr update

    Arguments
      ticket     Jira ticket key (e.g., "PROJ-123") - optional, will use Git branch if not provided
      time       Time to log (e.g., "2h 30m", "1h15m", "45m")
      today      Show today's worklogs and total hours with IDs
      sprint     Show worklogs for the last 14 days (sprint period)
      progress   Show sprint progress percentages for each day
      undo       Delete recent worklogs (interactive) or specific worklog by ID
      init       Set up JIRA and Tempo credentials
      update     Check for available updates

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
      $ bookr progress                        # Show sprint progress
      $ bookr undo                            # Show recent worklogs to undo
      $ bookr undo 12345                      # Undo specific worklog by ID
      $ bookr update                          # Check for updates
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

  // Show usage if no arguments provided
  if (input.length === 0) {
    cli.showHelp();
    return;
  }

  // Handle "today" command
  if (input[0] === 'today') {
    const { TodayWorklogs } = await import('./components/TodayWorklogs.js');
    render(React.createElement(TodayWorklogs));
    return;
  }

  // Handle "sprint" command
  if (input[0] === 'sprint') {
    const { SprintWorklogs } = await import('./components/SprintWorklogs.js');
    render(React.createElement(SprintWorklogs));
    return;
  }

  // Handle "progress" command
  if (input[0] === 'progress') {
    const command = await import('./commands/progress.js');
    await command.default();
    return;
  }

  // Handle "init" command
  if (input[0] === 'init') {
    const command = await import('./commands/init.js');
    await command.default();
    return;
  }

  // Handle "undo" command
  if (input[0] === 'undo') {
    const worklogId = input[1]; // Optional worklog ID
    
    if (worklogId) {
      // If worklog ID is provided, use the original command for actual deletion
      const command = await import('./commands/undo.js');
      await command.default(worklogId);
    } else {
      // If no worklog ID, show the interactive selection with deletion capability
      const { showUndoSelection } = await import('./commands/undo.js');
      await showUndoSelection();
    }
    return;
  }

  // Handle "update" command
  if (input[0] === 'update') {
    const { forceCheckForUpdates } = await import('./utils/update.js');
    try {
      const updateInfo = await forceCheckForUpdates();
      if (updateInfo.hasUpdate) {
        console.log(`📦 Update available: ${updateInfo.current} → ${updateInfo.latest}`);
        console.log('Run: npm update -g bookr-cli');
      } else {
        console.log('✅ You are running the latest version!');
      }
    } catch (error) {
      console.error(
        '❌ Failed to check for updates:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    return;
  }



  // Parse arguments to handle optional ticket parameter
  let ticket: string | undefined;
  let time: string | undefined;

  // Check if first argument looks like a ticket (contains a dash and number)
  if (input[0] && /^[A-Z0-9]+-\d+$/.test(input[0])) {
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
