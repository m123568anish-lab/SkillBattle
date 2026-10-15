import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/data/dashboard.ts', import.meta.url), 'utf8');

test('student mobile navigation exposes the business routes in the expected order', () => {
  assert.match(source, /\{ title: "Home", href: "\/dashboard"/);
  assert.match(source, /\{ title: "Battle", href: "\/battle"/);
  assert.match(source, /\{ title: "Leaderboard", href: "\/leaderboard"/);
  assert.match(source, /\{ title: "Friends", href: "\/friends"/);
  assert.match(source, /\{ title: "More"/);
});

test('college mobile navigation exposes the business routes in the expected order', () => {
  assert.match(source, /\{ title: "Home", href: "\/college\/dashboard"/);
  assert.match(source, /\{ title: "Students", href: "\/college\/dashboard\?view=students"/);
  assert.match(source, /\{ title: "Assessments", href: "\/college\/dashboard\?view=assessments"/);
  assert.match(source, /\{ title: "Placement", href: "\/placement\/scorecard"/);
});

test('company mobile navigation exposes the business routes in the expected order', () => {
  assert.match(source, /\{ title: "Home", href: "\/company\/dashboard"/);
  assert.match(source, /\{ title: "Jobs", href: "\/company\/dashboard\?view=jobs"/);
  assert.match(source, /\{ title: "Candidates", href: "\/company\/dashboard\?view=candidates"/);
  assert.match(source, /\{ title: "Interviews", href: "\/company\/dashboard\?view=interviews"/);
});

test('admin mobile navigation exposes the business routes in the expected order', () => {
  assert.match(source, /\{ title: "Home", href: "\/admin"/);
  assert.match(source, /\{ title: "Users", href: "\/admin\?tab=users"/);
  assert.match(source, /\{ title: "Organizations", href: "\/admin\?tab=organizations"/);
  assert.match(source, /\{ title: "Security", href: "\/admin\?tab=security"/);
});
