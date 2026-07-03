import { permanentRedirect } from 'next/navigation';

interface EditorProblemRedirectPageProps {
  params: {
    problemId: string;
  };
}

export default function EditorProblemRedirectPage({ params }: EditorProblemRedirectPageProps) {
  permanentRedirect(`/ide/${params.problemId}`);
}
