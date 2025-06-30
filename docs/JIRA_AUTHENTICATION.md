# JIRA Authentication Guide

This guide explains the different authentication methods available for connecting to JIRA and how to set them up for the Bookr CLI tool.

## Authentication Methods

### 1. API Token (Recommended for CLI tools)

**Best for**: CLI tools, scripts, automated systems

**How to set up**:
1. Go to your JIRA instance
2. Click on your profile picture → **Personal settings**
3. Go to **Security** tab
4. Click **Create API token**
5. Give it a label (e.g., "Bookr CLI")
6. Copy the generated token

**Environment variables**:
```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token-here"
```

**Usage in code**:
```typescript
import { createJiraClientFromEnv } from './api/jira-client.js';

const client = createJiraClientFromEnv();
```

### 2. Personal Access Token (PAT)

**Best for**: Modern JIRA Cloud instances

**How to set up**:
1. Go to your JIRA instance
2. Click on your profile picture → **Personal settings**
3. Go to **Security** tab
4. Click **Create personal access token**
5. Give it a name and select scopes
6. Copy the generated token

**Environment variables**:
```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_PAT="your-personal-access-token"
```

### 3. OAuth 2.0

**Best for**: Web applications, user-facing tools

**How to set up**:
1. Create an OAuth app in JIRA
2. Get client ID and client secret
3. Implement OAuth flow with redirect URLs
4. Handle refresh tokens

**More complex setup required** - see [JIRA OAuth documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-authorization-code-grants-3lo-for-apps/)

### 4. Service Account (Enterprise)

**Best for**: Enterprise integrations

**How to set up**:
1. Contact your JIRA administrator
2. Request a service account with specific permissions
3. Get service account credentials
4. Use with specific project/issue permissions

## Security Best Practices

### For CLI Tools:
- ✅ Use API tokens or Personal Access Tokens
- ✅ Store credentials in environment variables
- ✅ Use `.env` files (add to `.gitignore`)
- ✅ Set appropriate token expiration
- ❌ Don't hardcode credentials in source code
- ❌ Don't commit credentials to version control

### For Production:
- ✅ Use service accounts with minimal permissions
- ✅ Rotate tokens regularly
- ✅ Monitor API usage
- ✅ Use HTTPS for all connections
- ❌ Don't use basic authentication

## Environment Setup

### Option 1: Environment Variables
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token-here"
```

### Option 2: .env File
Create a `.env` file in your project root:
```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
```

Then load it in your application:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

### Option 3: Direct Configuration
```typescript
import { JiraClient } from './api/jira-client.js';

const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  email: 'your-email@example.com',
  apiToken: 'your-api-token-here'
});
```

## Testing Your Connection

Use the built-in test method:
```typescript
const client = createJiraClientFromEnv();
const isConnected = await client.testConnection();
console.log('Connection:', isConnected ? '✅ Success' : '❌ Failed');
```

## Troubleshooting

### Common Issues:

1. **"Missing JIRA environment variables"**
   - Check that all required environment variables are set
   - Verify variable names match exactly

2. **"Failed to get current user"**
   - Verify your API token is correct
   - Check that your email matches your JIRA account
   - Ensure your JIRA instance URL is correct

3. **"403 Forbidden"**
   - Check API token permissions
   - Verify you have access to the JIRA instance
   - Ensure the token hasn't expired

4. **"404 Not Found"**
   - Verify the JIRA base URL is correct
   - Check that the API endpoint exists in your JIRA version

### Getting Help:
- Check [JIRA REST API documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- Verify your JIRA instance supports the API version you're using
- Contact your JIRA administrator for permission issues 