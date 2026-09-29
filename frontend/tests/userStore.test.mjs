import { test } from 'node:test';
import assert from 'node:assert/strict';

const saved = new Map([['halden.session', 'existing-token']]);
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key) => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: (key) => saved.delete(key),
}, configurable: true });

const { useUserStore } = await import('../src/store/userStore.js');
const { axiosInstance, getErrorMessage } = await import('../src/api/axios.js');
const user = { id: '1', name: 'Test Member', email: 'member@example.test' };
const reply = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} });

test('existing sessions migrate and are verified before granting access', async () => {
  assert.equal(useUserStore.getState().token, 'existing-token');
  assert.equal(useUserStore.getState().isLoggedIn, false);
  let calls = 0;
  axiosInstance.defaults.adapter = async (config) => {
    calls++;
    assert.equal(config.url, '/auth/me');
    assert.equal(config.headers.Authorization, 'Bearer existing-token');
    return reply(config, { user });
  };
  await Promise.all([useUserStore.getState().checkSession(), useUserStore.getState().checkSession()]);
  assert.equal(calls, 1);
  assert.equal(useUserStore.getState().isLoggedIn, true);
  assert.equal(useUserStore.getState().loading, false);
});

test('login and signup use the existing backend contract and persist only the token', async () => {
  for (const action of ['login', 'signup']) {
    useUserStore.getState().logOut();
    const formData = { name: user.name, email: user.email, password: 'example-only-123' };
    axiosInstance.defaults.adapter = async (config) => {
      assert.equal(config.url, `/auth/${action}`);
      assert.deepEqual(JSON.parse(config.data), formData);
      return reply(config, { user, token: `${action}-token` });
    };
    await useUserStore.getState()[action](formData);
    assert.deepEqual(useUserStore.getState().user, user);
    assert.equal(useUserStore.getState().isLoggedIn, true);
    assert.deepEqual(JSON.parse(saved.get('user-storage')).state, { token: `${action}-token` });
    assert.equal(saved.has('halden.session'), false);
  }
});

test('expired sessions clear the saved token', async () => {
  axiosInstance.defaults.adapter = async () => { throw { response: { status: 401 } }; };
  await useUserStore.getState().checkSession();
  assert.equal(useUserStore.getState().token, null);
  assert.equal(useUserStore.getState().isLoggedIn, false);
  assert.equal(JSON.parse(saved.get('user-storage')).state.token, null);
});

test('logout cannot be undone by a delayed session response', async () => {
  useUserStore.setState({ token: 'pending-token' });
  let finish;
  axiosInstance.defaults.adapter = (config) => new Promise((resolve) => {
    finish = () => resolve(reply(config, { user }));
  });
  const pending = useUserStore.getState().checkSession();
  useUserStore.getState().logOut();
  finish();
  await pending;
  assert.equal(useUserStore.getState().user, null);
  assert.equal(useUserStore.getState().token, null);
  assert.equal(useUserStore.getState().loading, false);
});

test('temporary outages preserve the token but do not grant access', async () => {
  useUserStore.setState({ token: 'retry-token' });
  axiosInstance.defaults.adapter = async () => { throw { isAxiosError: true }; };
  await useUserStore.getState().checkSession();
  assert.equal(useUserStore.getState().token, 'retry-token');
  assert.equal(useUserStore.getState().isLoggedIn, false);
  assert.equal(useUserStore.getState().loading, false);
});

test('validation errors remain available to the form', async () => {
  const failure = { response: { status: 422, data: { error: {
    message: 'Please fix the highlighted fields.', fields: { email: 'Enter a valid email.' },
  } } } };
  axiosInstance.defaults.adapter = async () => { throw failure; };
  await assert.rejects(useUserStore.getState().signup({}), (error) => {
    assert.equal(getErrorMessage(error), 'Please fix the highlighted fields.');
    assert.equal(error.response.data.error.fields.email, 'Enter a valid email.');
    return true;
  });
});

test('blocked browser storage does not prevent login or logout', async () => {
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('Storage blocked'); }, configurable: true });
  axiosInstance.defaults.adapter = async (config) => reply(config, { user, token: 'memory-only' });
  await useUserStore.getState().login({ email: user.email, password: 'test' });
  assert.equal(useUserStore.getState().isLoggedIn, true);
  useUserStore.getState().logOut();
  assert.equal(useUserStore.getState().token, null);
});
