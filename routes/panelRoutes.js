const express = require("express");
const pool = require("../config/db");
const panelAuth = require("../middleware/panelAuth");

const router = express.Router();
router.use(panelAuth);

const SUBSCRIPTION_PLANS = ["none", "trial", "monthly", "yearly"];
const POST_STATUSES = ["draft", "scheduled", "published", "failed"];
const AUTH_TYPES = ["apple", "google", "guest"];

function positiveInt(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function likeTerm(value) {
  return `%${String(value || "").trim()}%`;
}

function pagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function cleanString(value, { allowEmpty = false } = {}) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed && !allowEmpty) return null;
  return trimmed;
}

function mapUser(row) {
  return {
    id: row.id,
    authId: row.firebase_uid,
    displayName: row.full_name || row.email || `Kullanıcı #${row.id}`,
    email: row.email,
    photoUrl: row.profile_image,
    status: "active",
    createdAt: row.created_at,
    updatedAt: row.created_at,
    lastLoginAt: row.created_at,
    extras: {
      firebaseUid: row.firebase_uid,
      authType: row.auth_type,
      language: row.language,
      isPremium: row.is_premium === 1 || row.is_premium === true,
      subscriptionPlan: row.subscription_plan || "none",
      premiumExpireDate: row.premium_expire_date,
      projectCount: Number(row.project_count || 0),
      brandCount: Number(row.brand_count || 0),
      postCount: Number(row.post_count || 0),
    },
  };
}

function mapProject(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.full_name || row.email,
    name: row.name,
    imageUrl: row.image_url,
    caption: row.caption,
    hashtags: row.hashtags,
    format: row.format,
    itemCount: Number(row.item_count || 0),
    createdAt: row.created_at,
  };
}

function mapBrand(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.full_name || row.email,
    brandName: row.brand_name,
    brandColors: row.brand_colors,
    sector: row.sector,
    targetAudience: row.target_audience,
    logoUrl: row.logo_url,
    createdAt: row.created_at,
  };
}

function mapPost(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.full_name || row.email,
    projectId: row.project_id,
    brandKitId: row.brand_kit_id,
    platform: row.platform,
    accountHandle: row.account_handle,
    caption: row.caption,
    mediaUrl: row.media_url,
    status: row.status,
    scheduledDate: row.scheduled_date,
    createdAt: row.created_at,
  };
}

router.get("/health", (_req, res) => {
  return res.json({ ok: true, service: "smplanner-panel" });
});

router.get("/options", (_req, res) => {
  return res.json({
    ok: true,
    data: {
      subscriptionPlans: SUBSCRIPTION_PLANS,
      postStatuses: POST_STATUSES,
      authTypes: AUTH_TYPES,
      platforms: ["instagram", "tiktok", "linkedin", "facebook", "all"],
      formats: ["post", "reels", "story"],
    },
  });
});

router.get("/analyse", async (_req, res) => {
  try {
    const [[userTotals]] = await pool.query(`
      SELECT
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN COALESCE(is_premium, 0) = 1 THEN 1 ELSE 0 END) AS premiumUsers,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS newUsersToday,
        SUM(CASE WHEN subscription_plan = 'trial' THEN 1 ELSE 0 END) AS trialUsers
      FROM users
    `);

    const [[projectTotals]] = await pool.query(`
      SELECT
        COUNT(*) AS totalProjects,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS projectsToday
      FROM projects
    `);

    const [[brandTotals]] = await pool.query(`
      SELECT COUNT(*) AS totalBrands FROM brand_kits
    `);

    const [[postTotals]] = await pool.query(`
      SELECT
        COUNT(*) AS totalPosts,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduledPosts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedPosts,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedPosts,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS postsToday
      FROM scheduled_posts
    `);

    let chatTotals = { totalMessages: 0, messagesToday: 0 };
    try {
      const [[row]] = await pool.query(`
        SELECT
          COUNT(*) AS totalMessages,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS messagesToday
        FROM ai_chat_history
      `);
      chatTotals = row || chatTotals;
    } catch {
      /* ignore */
    }

    const [daily] = await pool.query(`
      SELECT
        DATE(p.created_at) AS date,
        COUNT(*) AS projects,
        COUNT(DISTINCT p.user_id) AS activeUsers
      FROM projects p
      WHERE p.created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY DATE(p.created_at)
      ORDER BY date ASC
    `);

    const [planRows] = await pool.query(`
      SELECT COALESCE(subscription_plan, 'none') AS label, COUNT(*) AS count
      FROM users
      GROUP BY COALESCE(subscription_plan, 'none')
      ORDER BY count DESC
    `);

    const [formatRows] = await pool.query(`
      SELECT COALESCE(format, 'post') AS label, COUNT(*) AS count
      FROM projects
      GROUP BY COALESCE(format, 'post')
      ORDER BY count DESC
    `);

    const [platformRows] = await pool.query(`
      SELECT COALESCE(platform, 'all') AS label, COUNT(*) AS count
      FROM scheduled_posts
      GROUP BY COALESCE(platform, 'all')
      ORDER BY count DESC
    `);

    const [statusRows] = await pool.query(`
      SELECT COALESCE(status, 'draft') AS label, COUNT(*) AS count
      FROM scheduled_posts
      GROUP BY COALESCE(status, 'draft')
      ORDER BY count DESC
    `);

    return res.json({
      ok: true,
      contractVersion: 1,
      timezone: "Europe/Istanbul",
      summary: {
        totalUsers: Number(userTotals.totalUsers || 0),
        premiumUsers: Number(userTotals.premiumUsers || 0),
        newUsersToday: Number(userTotals.newUsersToday || 0),
        trialUsers: Number(userTotals.trialUsers || 0),
        totalProjects: Number(projectTotals.totalProjects || 0),
        projectsToday: Number(projectTotals.projectsToday || 0),
        totalBrands: Number(brandTotals.totalBrands || 0),
        totalPosts: Number(postTotals.totalPosts || 0),
        scheduledPosts: Number(postTotals.scheduledPosts || 0),
        publishedPosts: Number(postTotals.publishedPosts || 0),
        failedPosts: Number(postTotals.failedPosts || 0),
        postsToday: Number(postTotals.postsToday || 0),
        totalMessages: Number(chatTotals.totalMessages || 0),
        messagesToday: Number(chatTotals.messagesToday || 0),
      },
      daily: (daily || []).map((row) => ({
        date: row.date,
        projects: Number(row.projects || 0),
        activeUsers: Number(row.activeUsers || 0),
      })),
      insights: {
        subscriptionPlans: (planRows || []).map((row) => ({
          label: row.label || "none",
          count: Number(row.count || 0),
        })),
        projectFormats: (formatRows || []).map((row) => ({
          label: row.label || "post",
          count: Number(row.count || 0),
        })),
        postPlatforms: (platformRows || []).map((row) => ({
          label: row.label || "all",
          count: Number(row.count || 0),
        })),
        postStatuses: (statusRows || []).map((row) => ({
          label: row.label || "draft",
          count: Number(row.count || 0),
        })),
      },
    });
  } catch (error) {
    console.error("SM Planner panel analyse error:", error);
    return res.status(500).json({ ok: false, error: "Analiz verisi alınamadı." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const search = cleanString(req.query.search);
    const premium = cleanString(req.query.premium);
    const plan = cleanString(req.query.plan);

    const where = [];
    const params = [];

    if (search) {
      where.push(
        "(u.full_name LIKE ? OR u.email LIKE ? OR u.firebase_uid LIKE ? OR CAST(u.id AS CHAR) LIKE ?)"
      );
      const term = likeTerm(search);
      params.push(term, term, term, term);
    }

    if (premium === "1" || premium === "true") {
      where.push("COALESCE(u.is_premium, 0) = 1");
    } else if (premium === "0" || premium === "false") {
      where.push("COALESCE(u.is_premium, 0) = 0");
    }

    if (plan && SUBSCRIPTION_PLANS.includes(plan)) {
      where.push("u.subscription_plan = ?");
      params.push(plan);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        u.*,
        (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS project_count,
        (SELECT COUNT(*) FROM brand_kits b WHERE b.user_id = u.id) AS brand_count,
        (SELECT COUNT(*) FROM scheduled_posts s WHERE s.user_id = u.id) AS post_count
      FROM users u
      ${whereSql}
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      data: (rows || []).map(mapUser),
      pagination: pagination(page, limit, Number(total || 0)),
    });
  } catch (error) {
    console.error("SM Planner panel users list error:", error);
    return res.status(500).json({ ok: false, error: "Kullanıcı listesi alınamadı." });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz kullanıcı id." });
    }

    const [rows] = await pool.query(
      `
      SELECT
        u.*,
        (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS project_count,
        (SELECT COUNT(*) FROM brand_kits b WHERE b.user_id = u.id) AS brand_count,
        (SELECT COUNT(*) FROM scheduled_posts s WHERE s.user_id = u.id) AS post_count
      FROM users u
      WHERE u.id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Kullanıcı bulunamadı." });
    }

    const [projects] = await pool.query(
      `
      SELECT p.*,
        (SELECT COUNT(*) FROM project_items i WHERE i.project_id = p.id) AS item_count,
        u.full_name, u.email
      FROM projects p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.id DESC
      LIMIT 20
      `,
      [userId]
    );

    const [brands] = await pool.query(
      `
      SELECT b.*, u.full_name, u.email
      FROM brand_kits b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
      LIMIT 20
      `,
      [userId]
    );

    return res.json({
      ok: true,
      data: {
        ...mapUser(rows[0]),
        recentProjects: (projects || []).map(mapProject),
        brands: (brands || []).map(mapBrand),
      },
    });
  } catch (error) {
    console.error("SM Planner panel user detail error:", error);
    return res.status(500).json({ ok: false, error: "Kullanıcı detayı alınamadı." });
  }
});

router.patch("/users/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz kullanıcı id." });
    }

    const [existing] = await pool.query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [userId]);
    if (!existing.length) {
      return res.status(404).json({ ok: false, error: "Kullanıcı bulunamadı." });
    }

    const updates = [];
    const params = [];
    const body = req.body || {};

    if (body.fullName !== undefined || body.displayName !== undefined) {
      updates.push("full_name = ?");
      params.push(cleanString(body.fullName ?? body.displayName, { allowEmpty: true }) || null);
    }

    if (body.email !== undefined) {
      updates.push("email = ?");
      params.push(cleanString(body.email, { allowEmpty: true }) || null);
    }

    if (body.language !== undefined) {
      updates.push("language = ?");
      params.push(cleanString(body.language) || "en");
    }

    if (body.isPremium !== undefined) {
      updates.push("is_premium = ?");
      params.push(body.isPremium ? 1 : 0);
    }

    if (body.subscriptionPlan !== undefined) {
      const plan = cleanString(body.subscriptionPlan) || "none";
      if (!SUBSCRIPTION_PLANS.includes(plan)) {
        return res.status(400).json({ ok: false, error: "Geçersiz abonelik planı." });
      }
      updates.push("subscription_plan = ?");
      params.push(plan);
    }

    if (body.premiumExpireDate !== undefined) {
      updates.push("premium_expire_date = ?");
      params.push(cleanString(body.premiumExpireDate));
    }

    if (!updates.length) {
      return res.status(400).json({ ok: false, error: "Güncellenecek alan yok." });
    }

    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

    const [rows] = await pool.query(
      `
      SELECT
        u.*,
        (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS project_count,
        (SELECT COUNT(*) FROM brand_kits b WHERE b.user_id = u.id) AS brand_count,
        (SELECT COUNT(*) FROM scheduled_posts s WHERE s.user_id = u.id) AS post_count
      FROM users u
      WHERE u.id = ?
      LIMIT 1
      `,
      [userId]
    );

    return res.json({ ok: true, data: mapUser(rows[0]) });
  } catch (error) {
    console.error("SM Planner panel user patch error:", error);
    return res.status(500).json({ ok: false, error: "Kullanıcı güncellenemedi." });
  }
});

router.get("/projects", async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const search = cleanString(req.query.search);
    const userId = cleanString(req.query.userId);
    const format = cleanString(req.query.format);

    const where = [];
    const params = [];

    if (search) {
      where.push("(p.name LIKE ? OR p.caption LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)");
      const term = likeTerm(search);
      params.push(term, term, term, term);
    }

    if (userId) {
      where.push("p.user_id = ?");
      params.push(Number(userId));
    }

    if (format) {
      where.push("p.format = ?");
      params.push(format);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM projects p
      LEFT JOIN users u ON u.id = p.user_id
      ${whereSql}
      `,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        p.*,
        u.full_name,
        u.email,
        (SELECT COUNT(*) FROM project_items i WHERE i.project_id = p.id) AS item_count
      FROM projects p
      LEFT JOIN users u ON u.id = p.user_id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      data: (rows || []).map(mapProject),
      pagination: pagination(page, limit, Number(total || 0)),
    });
  } catch (error) {
    console.error("SM Planner panel projects list error:", error);
    return res.status(500).json({ ok: false, error: "Proje listesi alınamadı." });
  }
});

router.get("/projects/:projectId", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz proje id." });
    }

    const [rows] = await pool.query(
      `
      SELECT
        p.*,
        u.full_name,
        u.email,
        (SELECT COUNT(*) FROM project_items i WHERE i.project_id = p.id) AS item_count
      FROM projects p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [projectId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Proje bulunamadı." });
    }

    const [items] = await pool.query(
      `
      SELECT id, project_id, user_id, media_url, caption, hashtags, format, source, created_at
      FROM project_items
      WHERE project_id = ?
      ORDER BY id DESC
      LIMIT 50
      `,
      [projectId]
    );

    return res.json({
      ok: true,
      data: {
        ...mapProject(rows[0]),
        items: (items || []).map((item) => ({
          id: item.id,
          projectId: item.project_id,
          userId: item.user_id,
          mediaUrl: item.media_url,
          caption: item.caption,
          hashtags: item.hashtags,
          format: item.format,
          source: item.source,
          createdAt: item.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("SM Planner panel project detail error:", error);
    return res.status(500).json({ ok: false, error: "Proje detayı alınamadı." });
  }
});

router.delete("/projects/:projectId", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz proje id." });
    }

    const [existing] = await pool.query(`SELECT id FROM projects WHERE id = ? LIMIT 1`, [
      projectId,
    ]);
    if (!existing.length) {
      return res.status(404).json({ ok: false, error: "Proje bulunamadı." });
    }

    await pool.query(`DELETE FROM project_items WHERE project_id = ?`, [projectId]);
    await pool.query(`DELETE FROM projects WHERE id = ?`, [projectId]);
    return res.json({ ok: true, message: "Proje silindi." });
  } catch (error) {
    console.error("SM Planner panel project delete error:", error);
    return res.status(500).json({ ok: false, error: "Proje silinemedi." });
  }
});

router.get("/brands", async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const search = cleanString(req.query.search);
    const userId = cleanString(req.query.userId);

    const where = [];
    const params = [];

    if (search) {
      where.push(
        "(b.brand_name LIKE ? OR b.sector LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)"
      );
      const term = likeTerm(search);
      params.push(term, term, term, term);
    }

    if (userId) {
      where.push("b.user_id = ?");
      params.push(Number(userId));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM brand_kits b
      LEFT JOIN users u ON u.id = b.user_id
      ${whereSql}
      `,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT b.*, u.full_name, u.email
      FROM brand_kits b
      LEFT JOIN users u ON u.id = b.user_id
      ${whereSql}
      ORDER BY b.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      data: (rows || []).map(mapBrand),
      pagination: pagination(page, limit, Number(total || 0)),
    });
  } catch (error) {
    console.error("SM Planner panel brands list error:", error);
    return res.status(500).json({ ok: false, error: "Marka kitleri alınamadı." });
  }
});

router.delete("/brands/:brandId", async (req, res) => {
  try {
    const brandId = Number(req.params.brandId);
    if (!Number.isInteger(brandId) || brandId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz marka id." });
    }

    const [result] = await pool.query(`DELETE FROM brand_kits WHERE id = ?`, [brandId]);
    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, error: "Marka kiti bulunamadı." });
    }

    return res.json({ ok: true, message: "Marka kiti silindi." });
  } catch (error) {
    console.error("SM Planner panel brand delete error:", error);
    return res.status(500).json({ ok: false, error: "Marka kiti silinemedi." });
  }
});

router.get("/posts", async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const search = cleanString(req.query.search);
    const status = cleanString(req.query.status);
    const platform = cleanString(req.query.platform);
    const userId = cleanString(req.query.userId);

    const where = [];
    const params = [];

    if (search) {
      where.push(
        "(s.caption LIKE ? OR s.account_handle LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)"
      );
      const term = likeTerm(search);
      params.push(term, term, term, term);
    }

    if (status && POST_STATUSES.includes(status)) {
      where.push("s.status = ?");
      params.push(status);
    }

    if (platform) {
      where.push("s.platform = ?");
      params.push(platform);
    }

    if (userId) {
      where.push("s.user_id = ?");
      params.push(Number(userId));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM scheduled_posts s
      LEFT JOIN users u ON u.id = s.user_id
      ${whereSql}
      `,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT s.*, u.full_name, u.email
      FROM scheduled_posts s
      LEFT JOIN users u ON u.id = s.user_id
      ${whereSql}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      data: (rows || []).map(mapPost),
      pagination: pagination(page, limit, Number(total || 0)),
    });
  } catch (error) {
    console.error("SM Planner panel posts list error:", error);
    return res.status(500).json({ ok: false, error: "Gönderi listesi alınamadı." });
  }
});

router.delete("/posts/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId) || postId < 1) {
      return res.status(400).json({ ok: false, error: "Geçersiz gönderi id." });
    }

    const [result] = await pool.query(`DELETE FROM scheduled_posts WHERE id = ?`, [postId]);
    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, error: "Gönderi bulunamadı." });
    }

    return res.json({ ok: true, message: "Gönderi silindi." });
  } catch (error) {
    console.error("SM Planner panel post delete error:", error);
    return res.status(500).json({ ok: false, error: "Gönderi silinemedi." });
  }
});

module.exports = router;
