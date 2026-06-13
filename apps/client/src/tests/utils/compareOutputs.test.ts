// ── compareOutputs Tests ─────────────────────────
// This mirrors the server-side compareOutputs for client-side testing

function compareOutputs(actual: string, expected: string): boolean {
  const normalize = (s: string): string[] => {
    const lines = s.split('\n').map((l) => l.trimEnd());

    // Remove leading blank lines
    while (lines.length > 0 && lines[0] === '') {
      lines.shift();
    }

    // Remove trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines;
  };

  const actualLines = normalize(actual);
  const expectedLines = normalize(expected);

  if (actualLines.length !== expectedLines.length) {
    return false;
  }

  return actualLines.every((line, i) => line === expectedLines[i]);
}

describe('compareOutputs', () => {
  it('returns true for identical outputs', () => {
    expect(compareOutputs('hello\nworld', 'hello\nworld')).toBe(true);
  });

  it('trims trailing whitespace before comparing', () => {
    expect(compareOutputs('hello  \nworld  \n', 'hello\nworld')).toBe(true);
  });

  it('returns false for different outputs', () => {
    expect(compareOutputs('hello', 'world')).toBe(false);
  });

  it('handles different line counts', () => {
    expect(compareOutputs('line1\nline2', 'line1')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(compareOutputs('', '')).toBe(true);
  });

  it('handles trailing newlines in actual', () => {
    expect(compareOutputs('42\n\n\n', '42')).toBe(true);
  });

  it('handles leading newlines', () => {
    expect(compareOutputs('\n\nhello', 'hello')).toBe(true);
  });

  it('handles multi-line with trailing spaces', () => {
    expect(compareOutputs('1 2 3  \n4 5 6  ', '1 2 3\n4 5 6')).toBe(true);
  });
});
