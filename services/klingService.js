const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;

/**
 * KIE.AI için token döner.
 * KIE.AI JWT üretimi gerektirmiyor — sadece API key'i Bearer olarak kullanıyor.
 */
function createKlingToken(accessKey = KLING_ACCESS_KEY) {
  if (!accessKey) {
    throw new Error('KLING_ACCESS_KEY eksik. .env dosyasını kontrol edin.');
  }
  // KIE.AI: Authorization: Bearer {api_key}
  return accessKey;
}

module.exports = { createKlingToken };
