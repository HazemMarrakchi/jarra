// ═══════════════════════════════════════════════════════════════════
// JARRA — notify-baskets (Edge Function, Deno)
// Appelée par l'app après chaque publication de panier : envoie une
// notification Web Push à tous les appareils abonnés (table
// push_subscriptions). Tier gratuit Supabase + Web Push = 0 DT.
//
// Déploiement : dashboard Supabase → Edge Functions → « notify-baskets »
// → coller ce fichier → Secrets : VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés automatiquement.)
// ═══════════════════════════════════════════════════════════════════

// eslint-disable-next-line import/no-unresolved
import webpush from 'npm:web-push@3.6.7';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const supaUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!vapidPublic || !vapidPrivate || !supaUrl || !serviceKey) {
    return json({ error: 'secrets manquants (VAPID / SUPABASE)' }, 500);
  }
  const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const body = (await req.json().catch(() => ({}))) as { basketId?: string };
  if (!body.basketId) return json({ error: 'basketId requis' }, 400);

  // 1) Le panier existe vraiment et est en ligne ? (anti-spam : on ne
  //    notifie que du réel, jamais du contenu fourni par l'appelant.)
  const bRes = await fetch(
    `${supaUrl}/rest/v1/baskets?id=eq.${encodeURIComponent(body.basketId)}&status=eq.live` +
      '&select=title,rescue_price,quantity_left,pickup_to,merchant_id',
    { headers: dbHeaders },
  );
  const baskets = (await bRes.json()) as Array<{
    title: string; rescue_price: number; quantity_left: number;
    pickup_to: string; merchant_id: string;
  }>;
  const b = baskets?.[0];
  if (!b) return json({ skipped: 'panier introuvable ou hors ligne' }, 200);

  const mRes = await fetch(
    `${supaUrl}/rest/v1/merchants?id=eq.${encodeURIComponent(b.merchant_id)}&select=name,area`,
    { headers: dbHeaders },
  );
  const merchant = ((await mRes.json()) as Array<{ name: string; area: string }>)?.[0];

  // 2) Tous les abonnés
  const sRes = await fetch(`${supaUrl}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`, {
    headers: dbHeaders,
  });
  const subs = (await sRes.json()) as Array<{ endpoint: string; p256dh: string; auth: string }>;
  if (!Array.isArray(subs) || subs.length === 0) return json({ sent: 0 }, 200);

  // 3) Envoi Web Push (format attendu par le service worker Angular :
  //    { notification: { title, body, icon, data.onActionClick… } })
  webpush.setVapidDetails('mailto:contact@jarra.tn', vapidPublic, vapidPrivate);
  const until = new Date(b.pickup_to).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis',
  });
  const payload = JSON.stringify({
    notification: {
      title: `🏺 ${b.title}`,
      body: `${merchant?.name ?? 'Commerçant'} · ${merchant?.area ?? 'Gabès'} · ` +
        `${(b.rescue_price / 1000).toFixed(3).replace('.', ',')} DT · jusqu'à ${until}`,
      icon: 'favicon.svg',
      badge: 'favicon.svg',
      data: {
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: '/#/explorer' },
        },
      },
    },
  });

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        // 404/410 = abonnement expiré côté navigateur → à supprimer.
        const status = (e as { statusCode?: number })?.statusCode ?? 0;
        if (status === 404 || status === 410) dead.push(s.endpoint);
      }
    }),
  );

  // 4) Ménage : purge des abonnements morts
  await Promise.all(
    dead.map((endpoint) =>
      fetch(`${supaUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
        headers: dbHeaders,
      })
    ),
  );

  return json({ sent, pruned: dead.length }, 200);
});
