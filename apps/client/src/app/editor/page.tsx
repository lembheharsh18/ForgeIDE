import { permanentRedirect } from 'next/navigation';

interface EditorRedirectPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function toQueryString(searchParams?: EditorRedirectPageProps['searchParams']) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  });

  return params.toString();
}

export default function EditorRedirectPage({ searchParams }: EditorRedirectPageProps) {
  const query = toQueryString(searchParams);
  permanentRedirect(query ? `/ide?${query}` : '/ide');
}
