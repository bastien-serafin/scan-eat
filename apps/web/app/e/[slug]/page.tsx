import { MenuClient } from '@/components/menu-client';
import { getMenu } from '@/lib/api';

export default async function ClientMenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string; sig?: string; exp?: string };
}) {
  if (!searchParams.t || !searchParams.sig || !searchParams.exp) {
    return <main className="p-4">Lien QR invalide (t, sig, exp requis)</main>;
  }

  try {
    const menu = await getMenu(params.slug, {
      t: searchParams.t,
      sig: searchParams.sig,
      exp: searchParams.exp,
    });

    return <MenuClient slug={params.slug} menu={menu} />;
  } catch (e) {
    return <main className="p-4">Erreur chargement menu: {(e as Error).message}</main>;
  }
}
