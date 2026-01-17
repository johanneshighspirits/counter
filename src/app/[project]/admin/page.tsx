'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default function AdminPage(props: PageProps) {
  const [project, setProject] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Get project from params
    props.params.then((params) => {
      setProject(params.project);
    });

    // Check authentication status from server
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [props.params]);

  if (isAuthenticated === null || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <main>
      <div className="grid place-items-center min-h-screen">
        <div className="flex flex-col gap-8 items-center">
          <Link href={`/${project}/counter`}>Back to Counter</Link>
          <Link href={`/${project}/menu`}>Price list</Link>

          <div className="flex flex-col gap-6">
            <ResetButton />
            <MaxCountInput />
          </div>
        </div>
      </div>
    </main>
  );
}
