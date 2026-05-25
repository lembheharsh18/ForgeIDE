// ── Language Configuration ───────────────────────
// Client-side language config for editor + execution

export type Language = 'cpp' | 'python' | 'java' | 'javascript' | 'go';

export interface LanguageConfig {
  display: string;
  pistonLanguage: string;
  pistonVersion: string;
  monacoLanguage?: string;
  fileExtension: string;
  boilerplate: string;
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  cpp: {
    display: 'C++17',
    pistonLanguage: 'c++',
    pistonVersion: '10.2.0',
    monacoLanguage: 'cpp',
    fileExtension: '.cpp',
    boilerplate: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Your solution here

    return 0;
}
`,
  },
  python: {
    display: 'Python 3',
    pistonLanguage: 'python',
    pistonVersion: '3.10.0',
    fileExtension: '.py',
    boilerplate: `import sys
input = sys.stdin.readline

def solve():
    # Your solution here
    pass

if __name__ == "__main__":
    solve()
`,
  },
  java: {
    display: 'Java 17',
    pistonLanguage: 'java',
    pistonVersion: '15.0.2',
    fileExtension: '.java',
    boilerplate: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();

        // Your solution here

        System.out.print(sb);
    }
}
`,
  },
  javascript: {
    display: 'JavaScript',
    pistonLanguage: 'javascript',
    pistonVersion: '18.15.0',
    fileExtension: '.js',
    boilerplate: `'use strict';

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

const lines = [];

rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    // Your solution here
    const n = parseInt(lines[0]);
    console.log(n);
});
`,
  },
  go: {
    display: 'Go',
    pistonLanguage: 'go',
    pistonVersion: '1.16.2',
    fileExtension: '.go',
    boilerplate: `package main

import (
\t"bufio"
\t"fmt"
\t"os"
)

func main() {
\treader := bufio.NewReader(os.Stdin)
\twriter := bufio.NewWriter(os.Stdout)
\tdefer writer.Flush()

\t// Your solution here
\t_ = reader
\tfmt.Fprintln(writer, "Hello, World!")
}
`,
  },
};

export const LANGUAGE_KEYS = Object.keys(LANGUAGES) as Language[];
