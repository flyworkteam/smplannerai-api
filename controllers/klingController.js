const { createKlingToken } = require('../services/klingService');

/**
 * GET /api/kling/token
 * Kling AI API için taze bir Bearer token üretir.
 * n8n workflow'u bunu çağırarak her seferinde geçerli bir token alır.
 */
exports.getToken = (req, res) => {
  try {
    const token = createKlingToken();
    return res.json({
      success: true,
      token,
      bearer: `Bearer ${token}`,
      access_key: process.env.KLING_ACCESS_KEY,
      expires_in: 1800
    });
  } catch (err) {
    console.error('[Kling] Token üretme hatası:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
