/**
 * Extract text from JIRA comment (handles both string and structured formats)
 */
export function extractCommentText(
  comment:
    | string
    | {
        content: Array<{ content: Array<{ text: string; type: string }>; type: string }>;
        type: string;
        version: number;
      }
    | undefined
): string {
  if (!comment) return 'No comment';

  if (typeof comment === 'string') {
    return comment;
  }

  // Handle structured comment format
  if (comment.content && Array.isArray(comment.content)) {
    const texts: string[] = [];
    for (const block of comment.content) {
      if (block.content && Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.text) {
            texts.push(item.text);
          }
        }
      }
    }
    return texts.join(' ').trim() || 'No comment';
  }

  return 'No comment';
}
