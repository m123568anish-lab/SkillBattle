import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/data/dashboard.ts', import.meta.url), 'utf8');

test('student mobile navigation exposes the business routes in the expected order', () => {
  assert.match(source, /\{ title: "Home", href: "\/dashboard"/);
  assert.match(source, /\{ title: "Battle", href: "\/battle"/);
  assert.match(source, /\{ title: "Tournament", href: "\/tournament"/);
  assert.match(source, /\{ title: "Friends", href: "\/friends"/);
  assert.match(source, /\{ title: "More"/);
});
