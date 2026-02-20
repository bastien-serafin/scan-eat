'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createOrder } from '@/lib/api';
import { formatPrice } from './price';
import type { MenuResponse, Product } from '@/lib/types';

type CartItem = {
  product: Product;
  qty: number;
  notes?: string;
  chosenOptions: Record<string, unknown>;
};

type Locale = 'fr' | 'en';

const labels: Record<
  Locale,
  {
    qrError: string;
    sending: string;
    submit: string;
    cart: string;
    emptyCart: string;
    total: string;
    close: string;
    notes: string;
    notesPlaceholder: string;
    add: string;
    language: string;
    table: string;
  }
> = {
  fr: {
    qrError: 'URL QR invalide',
    sending: 'Envoi...',
    submit: 'Valider commande',
    cart: 'Panier',
    emptyCart: 'Aucun article',
    total: 'Total',
    close: 'Fermer',
    notes: 'Notes',
    notesPlaceholder: 'Sans sel, allergie...',
    add: 'Ajouter',
    language: 'Langue',
    table: 'Table',
  },
  en: {
    qrError: 'Invalid QR URL',
    sending: 'Sending...',
    submit: 'Place order',
    cart: 'Cart',
    emptyCart: 'No item',
    total: 'Total',
    close: 'Close',
    notes: 'Notes',
    notesPlaceholder: 'No salt, allergy...',
    add: 'Add',
    language: 'Language',
    table: 'Table',
  },
};

const enDictionary: Record<string, string> = {
  'Le Bistrot Demo': 'The Bistro Demo',
  'Table 1': 'Table 1',
  'Table 2': 'Table 2',
  'Chambre 101': 'Room 101',

  Entrées: 'Starters',
  Plats: 'Main Courses',
  Boissons: 'Drinks',

  'Soupe du jour': 'Soup of the Day',
  'Légumes de saison': 'Seasonal vegetables',
  'Salade César': 'Caesar Salad',
  'Poulet, parmesan, croûtons': 'Chicken, parmesan, croutons',
  Bruschetta: 'Bruschetta',
  'Tomate, basilic, ail': 'Tomato, basil, garlic',
  Carpaccio: 'Carpaccio',
  'Boeuf, huile d\'olive, roquette': 'Beef, olive oil, arugula',
  'Assiette mixte': 'Mixed Plate',
  'Charcuterie et fromages': 'Cold cuts and cheeses',

  'Burger maison': 'House Burger',
  'Steak haché, cheddar, frites': 'Beef patty, cheddar, fries',
  'Steak frites': 'Steak and Fries',
  'Boeuf grillé, sauce au poivre': 'Grilled beef, pepper sauce',
  'Pâtes pesto': 'Pesto Pasta',
  'Basilic, parmesan, pignons': 'Basil, parmesan, pine nuts',
  'Risotto champignons': 'Mushroom Risotto',
  'Crème et parmesan': 'Cream and parmesan',
  'Tartare de boeuf': 'Beef Tartare',
  'Préparation minute': 'Prepared to order',

  'Eau minérale': 'Mineral Water',
  Soda: 'Soda',
  'Jus d\'orange': 'Orange Juice',
  'Verre de vin': 'Glass of Wine',
  'Bière pression': 'Draft Beer',

  'Retirer ingrédients': 'Remove ingredients',
  Cuisson: 'Cooking',
  Oignons: 'Onions',
  Tomates: 'Tomatoes',
  Fromage: 'Cheese',
  Sauce: 'Sauce',
  Bleu: 'Blue rare',
  Saignant: 'Rare',
  'A point': 'Medium',
  'Bien cuit': 'Well done',
};

function translate(text: string, locale: Locale) {
  if (locale === 'fr') {
    return text;
  }
  return enDictionary[text] ?? text;
}

export function MenuClient({ slug, menu }: { slug: string; menu: MenuResponse }) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>('fr');
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = labels[locale];

  const displayMenu = useMemo(() => {
    return {
      ...menu,
      establishment: {
        ...menu.establishment,
        name: translate(menu.establishment.name, locale),
      },
      table: {
        ...menu.table,
        label: translate(menu.table.label, locale),
      },
      categories: menu.categories.map((category) => ({
        ...category,
        name: translate(category.name, locale),
        products: category.products.map((product) => ({
          ...product,
          name: translate(product.name, locale),
          description: translate(product.description, locale),
          optionGroups: product.optionGroups.map((group) => ({
            ...group,
            name: translate(group.name, locale),
            rules: {
              ...group.rules,
              options: (group.rules.options ?? []).map((opt) => translate(opt, locale)),
            },
          })),
        })),
      })),
    };
  }, [locale, menu]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cart],
  );

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    setSelected(null);
  };

  const submitOrder = async () => {
    const tableId = searchParams.get('t');
    const sig = searchParams.get('sig');
    const exp = searchParams.get('exp');

    if (!tableId || !sig || !exp) {
      setError(t.qrError);
      return;
    }

    if (!cart.length) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const useStripe = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true';
      const order = await createOrder(slug, {
        tableId,
        sig,
        exp,
        paymentMode: useStripe ? 'STRIPE' : 'SIMULATED',
        items: cart.map((line) => ({
          productId: line.product.id,
          qty: line.qty,
          notes: line.notes,
          chosenOptions: line.chosenOptions,
        })),
      });
      router.push(`/e/${slug}/order/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-4">
      <header className="card">
        <p className="text-sm text-slate-500">
          {t.table}: {displayMenu.table.label}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Image src="/restaurant-logo.svg" alt="Logo restaurant" width={40} height={40} className="rounded-lg" />
          <h1 className="text-xl font-semibold">{displayMenu.establishment.name}</h1>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm text-slate-600" htmlFor="lang">
            {t.language}
          </label>
          <select
            id="lang"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>

      {displayMenu.categories.map((category) => (
        <section key={category.id} className="space-y-2">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          {category.products.map((product) => (
            <button
              key={product.id}
              className="card w-full text-left"
              onClick={() => setSelected(product)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.description}</p>
                </div>
                <p className="whitespace-nowrap text-sm font-semibold">{formatPrice(product.price)}</p>
              </div>
            </button>
          ))}
        </section>
      ))}

      <section className="card sticky bottom-3 space-y-2">
        <p className="font-semibold">
          {t.cart} ({cart.length})
        </p>
        {cart.length ? (
          <ul className="space-y-1 text-sm">
            {cart.map((line, idx) => (
              <li key={`${line.product.id}-${idx}`}>
                {line.qty} x {line.product.name} ({formatPrice(line.product.price * line.qty)})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t.emptyCart}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="font-semibold">
            {t.total}: {formatPrice(total)}
          </p>
          <button className="btn-primary" type="button" onClick={submitOrder} disabled={loading || !cart.length}>
            {loading ? t.sending : t.submit}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={addToCart} locale={locale} />
      )}
    </main>
  );
}

function ProductModal({
  product,
  onClose,
  onAdd,
  locale,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (line: CartItem) => void;
  locale: Locale;
}) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, unknown>>({});
  const t = labels[locale];

  return (
    <div className="fixed inset-0 z-10 flex items-end bg-black/40 p-2">
      <div className="card w-full space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">{product.name}</p>
            <p className="text-sm text-slate-600">{product.description}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary">
            {t.close}
          </button>
        </div>

        {product.optionGroups.map((group) => {
          const options = group.rules.options || [];
          if (group.type === 'COOKING') {
            return (
              <div key={group.id} className="space-y-1">
                <p className="font-medium">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [group.type]: opt }))}
                      className={`btn-secondary ${(selectedOptions[group.type] as string | undefined) === opt ? '!bg-brand !text-white' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          const selectedValues = (selectedOptions[group.type] as string[] | undefined) ?? [];
          return (
            <div key={group.id} className="space-y-1">
              <p className="font-medium">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const isChecked = selectedValues.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      className={`btn-secondary ${isChecked ? '!bg-brand !text-white' : ''}`}
                      onClick={() => {
                        const updated = isChecked
                          ? selectedValues.filter((o) => o !== opt)
                          : [...selectedValues, opt];
                        setSelectedOptions((prev) => ({ ...prev, [group.type]: updated }));
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <label className="block text-sm">
          {t.notes}
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
          />
        </label>

        <div className="flex items-center gap-2">
          <button className="btn-secondary" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            -
          </button>
          <span>{qty}</span>
          <button className="btn-secondary" type="button" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>

        <button
          type="button"
          className="btn-primary w-full"
          onClick={() =>
            onAdd({
              product,
              qty,
              notes: notes || undefined,
              chosenOptions: selectedOptions,
            })
          }
        >
          {t.add} ({formatPrice(product.price * qty)})
        </button>
      </div>
    </div>
  );
}
