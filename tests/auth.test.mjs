import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function action(signIn) {
  const { outputText } = ts.transpileModule(readFileSync('src/lib/actions/auth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const mod = { exports: {} };
  const logs = [];
  new Function('module', 'exports', 'require', 'console', outputText)(mod, mod.exports, (id) => {
    if (id === 'next/navigation') return { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } };
    if (id === '@/lib/supabase/server') return { createClient: async () => ({ auth: { signInWithPassword: signIn } }) };
    throw new Error(id);
  }, { warn: (...args) => logs.push(args) });
  return { login: mod.exports.login, logs };
}
function form() {
  const data = new FormData();
  data.set('email', 'person@example.test');
  data.set('password', 'test-secret');
  return data;
}

test('login distinguishes rejected credentials, account restrictions and service failures without logging secrets', async () => {
  for (const [error, expected] of [
    [{ code: 'invalid_credentials', status: 400 }, /Email ou password incorretos/],
    [{ code: 'email_not_confirmed', status: 400 }, /Confirme o seu email/],
    [{ code: 'user_banned', status: 403 }, /suspenso/],
    [{ status: 429 }, /Demasiadas tentativas/],
    [{ status: 503 }, /serviço de autenticação/],
  ]) {
    const { login, logs } = action(async () => ({ error: { ...error, message: 'test-secret' } }));
    assert.match((await login({}, form())).error, expected);
    assert.doesNotMatch(JSON.stringify(logs), /test-secret|person@example/);
  }
});

test('a connection failure returns an actionable error and a successful login still redirects', async () => {
  const offline = action(async () => { throw new TypeError('fetch failed'); });
  assert.match((await offline.login({}, form())).error, /Verifique a ligação/);
  const success = action(async () => ({ error: null }));
  await assert.rejects(success.login({}, form()), /REDIRECT:\/admin/);
});
