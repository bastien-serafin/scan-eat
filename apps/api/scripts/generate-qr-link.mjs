#!/usr/bin/env node
import crypto from 'crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.split('=');
    return [k.replace(/^--/, ''), v];
  }),
);

const slug = args.slug;
const tableId = args.table;
const appUrl = args.appUrl ?? 'http://localhost:3000';
const qrSecret = args.secret ?? process.env.QR_SECRET ?? 'change_me_too';
const exp = String(Date.now() + 24 * 60 * 60 * 1000);

if (!slug || !tableId) {
  console.error('Usage: node generate-qr-link.mjs --slug=le-bistrot-demo --table=tableId [--appUrl=http://localhost:3000]');
  process.exit(1);
}

const raw = `${slug}:${tableId}:${exp}`;
const sig = crypto.createHmac('sha256', qrSecret).update(raw).digest('hex');

const url = `${appUrl}/e/${slug}?t=${encodeURIComponent(tableId)}&exp=${exp}&sig=${sig}`;
console.log(url);
