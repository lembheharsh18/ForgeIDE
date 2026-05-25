'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import api from '../../../lib/axios';
import { useEditorStore } from '../../../store/editorStore';
import EditorPage from '../page';

// ── Editor with Problem ──────────────────────────
// Re-uses the main editor layout but fetches and loads
// the problem matching the URL param.

export default function EditorWithProblemPage() {
  const params = useParams();
  const problemId = params?.problemId as string;
  const { currentProblem, setCurrentProblem } = useEditorStore();

  useEffect(() => {
    if (!problemId) return;
    if (currentProblem?.id === problemId) return;

    const fetchProblem = async () => {
      try {
        const res = await api.get(`/api/problems/${problemId}`);
        setCurrentProblem(res.data.problem || res.data);
      } catch {
        // Problem not found — stay in scratch mode
      }
    };

    fetchProblem();
  }, [problemId, currentProblem?.id, setCurrentProblem]);

  return <EditorPage />;
}
