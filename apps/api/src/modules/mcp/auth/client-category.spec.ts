import { mcpClientCategory } from './client-category';

describe('mcpClientCategory', () => {
  it.each([
    ['Claude', 'claude'],
    ['claude.ai', 'claude'],
    ['ChatGPT Connector', 'chatgpt'],
    ['OpenAI', 'chatgpt'],
    ['Cursor', 'cursor'],
    ['Le Chat', 'mistral'],
    ['Gemini CLI', 'gemini'],
    ['My script', 'other'],
    [null, 'other'],
  ])('%s is %s', (name, category) => {
    expect(mcpClientCategory(name)).toBe(category);
  });
});
