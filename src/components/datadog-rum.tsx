"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function DatadogRUM() {
  const pathname = usePathname();
  const rumRef = useRef<any>(null);

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
    const appId = process.env.NEXT_PUBLIC_DATADOG_RUM_APP_ID || process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID;
    if (!clientToken || !appId) return;

    // Dynamically import to keep server bundle clean
    import("@datadog/browser-rum")
      .then(({ datadogRum }) => {
        // expose resolved config for debugging in the browser
        try {
          // eslint-disable-next-line no-console
          console.info('Datadog RUM resolved config', { clientToken, appId, site: process.env.NEXT_PUBLIC_DATADOG_SITE });
          // @ts-ignore
          if (typeof window !== 'undefined') window.__DD_RUM_CONFIG = { clientToken, appId, site: process.env.NEXT_PUBLIC_DATADOG_SITE };
        } catch (e) {
          // ignore
        }
        datadogRum.init({
          applicationId: appId,
          clientToken: clientToken,
          site: process.env.NEXT_PUBLIC_DATADOG_SITE || "datadoghq.com",
          service: process.env.NEXT_PUBLIC_DATADOG_SERVICE || "jira-clone",
          env: process.env.NEXT_PUBLIC_DATADOG_ENV || process.env.NODE_ENV || "production",
          sessionSampleRate: Number(process.env.NEXT_PUBLIC_DATADOG_SAMPLE_RATE) || 100,
          sessionReplaySampleRate: Number(process.env.NEXT_PUBLIC_DATADOG_SESSION_REPLAY_SAMPLE_RATE) || 20,
          defaultPrivacyLevel: (process.env.NEXT_PUBLIC_DATADOG_DEFAULT_PRIVACY_LEVEL as any) || 'mask-user-input',
          trackInteractions: true,
          // For Next.js App Router we manually report views on route change below
          trackViewsManually: true,
        });

        if ((process.env.NEXT_PUBLIC_DATADOG_SESSION_REPLAY_SAMPLE_RATE || '20') !== '0') {
          datadogRum.startSessionReplayRecording && datadogRum.startSessionReplayRecording();
        }

        rumRef.current = datadogRum;
        // initial view (use window.location to avoid depending on `pathname` in this one-time effect)
        try {
          const initialPath = typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname : '/';
          rumRef.current.startView && rumRef.current.startView({ name: initialPath, url: typeof window !== 'undefined' ? window.location.href : '/' });
        } catch (e) {
          // ignore
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('Datadog RUM init failed:', e && e.message ? e.message : e);
      });
  }, []);

  // report view changes when pathname changes
  useEffect(() => {
    if (!rumRef.current) return;
    try {
      rumRef.current.startView && rumRef.current.startView({ name: pathname || '/', url: window.location.href });
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  return null;
}
