'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const SESSION_ID_KEY = 'bi3echri_visit_session_id';
const SENT_FLAG_KEY = 'bi3echri_visit_sent';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

/** Records one visit per browser tab session (not one ping per page view). */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SENT_FLAG_KEY)) return;
    sessionStorage.setItem(SENT_FLAG_KEY, '1');
    api
      .post('/public/analytics/visit', { sessionId: getSessionId(), path: pathname })
      .catch(() => {
        // Le suivi de visite ne doit jamais bloquer/alerter l'utilisateur.
        sessionStorage.removeItem(SENT_FLAG_KEY);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
