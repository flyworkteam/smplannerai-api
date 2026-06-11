const crypto = require('crypto');

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

/**
 * Kling AI API için JWT token üretir.
 * Token süresi 30 dakikadır (1800 saniye).
 */
function createKlingToken(accessKey = KLING_ACCESS_KEY, secretKey = KLING_SECRET_KEY) {
  if (!accessKey || !secretKey) {
    throw new Error('KLING_ACCESS_KEY veya KLING_SECRET_KEY eksik. .env dosyasını kontrol edin.');
  }

  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iss: accessKey, exp: now + 1800, nbf: now - 5 };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const data = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

module.exports = { createKlingToken };
