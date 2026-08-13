(async () => {
  try {
    const ts = Date.now();
    const username = `fe_user_${ts}`;
    const email = `fe_${ts}@example.com`;
    const password = `Passw0rd!${ts % 1000}`;

    const base = process.env.API_BASE || 'http://127.0.0.1:8000/api/v1';

    console.log('Using base:', base);

    // Register
    let res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({ username, email, password, full_name: 'FE Test' })
    });

    console.log('register status', res.status);
    let json = await res.text();
    console.log('register body:', json);

    // Login
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password }),
    });

    console.log('login status', res.status);
    const loginBody = await res.json().catch(() => null);
    console.log('login body:', loginBody);

    if (loginBody?.tokens?.access_token) {
      const token = loginBody.tokens.access_token;
      // Call me
      res = await fetch(`${base}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost:3000' },
      });
      console.log('/auth/me status', res.status);
      const me = await res.json().catch(() => null);
      console.log('/auth/me body:', me);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
