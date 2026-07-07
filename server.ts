import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/lib/firebase.js";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  addDoc, 
  updateDoc, 
  increment,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to generate random alphanumeric strings
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// User-agent parser helper
function parseUserAgent(uaString: string) {
  const ua = uaString || "";
  let browser = "Lainnya";
  let os = "Lainnya";
  let device: "Desktop" | "Mobile" | "Tablet" = "Desktop";

  // Browser detection
  if (ua.includes("CriOS") || ua.includes("Chrome")) {
    browser = "Chrome";
  } else if (ua.includes("FxiOS") || ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("CriOS")) {
    browser = "Safari";
  } else if (ua.includes("Edg") || ua.includes("Edge")) {
    browser = "Edge";
  } else if (ua.includes("OPR") || ua.includes("Opera")) {
    browser = "Opera";
  }

  // OS detection
  if (ua.includes("Windows NT")) {
    os = "Windows";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) {
    os = "macOS";
  } else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) {
    os = "iOS";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }

  // Device detection
  if (ua.includes("iPad") || ua.includes("Tablet")) {
    device = "Tablet";
  } else if (ua.includes("Mobile") || ua.includes("iPhone") || (ua.includes("Android") && !ua.includes("Tablet"))) {
    device = "Mobile";
  }

  return { browser, os, device };
}

// Referer parser helper
function parseReferer(refererString: string) {
  if (!refererString) return "Langsung / Direct";
  try {
    const url = new URL(refererString);
    const hostname = url.hostname.replace("www.", "");
    if (hostname.includes("google")) return "Google";
    if (hostname.includes("facebook") || hostname.includes("fb")) return "Facebook";
    if (hostname.includes("twitter") || hostname.includes("t.co")) return "Twitter";
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("youtube")) return "YouTube";
    return hostname;
  } catch (e) {
    return "Lainnya";
  }
}

// List of reserved route paths that cannot be used as link aliases
const RESERVED_ALIASES = [
  "api", "assets", "vite", "favicon.ico", "index.html", 
  "login", "register", "dashboard", "analytics", "history", "developer"
];

// Helper to authenticate third-party developer API keys
async function authenticateApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Token API tidak ditemukan atau tidak valid." });
  }
  const apiKey = authHeader.substring(7);

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("apiKey", "==", apiKey));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: "Token API tidak terdaftar." });
    }

    const userDoc = querySnapshot.docs[0];
    req.body.authenticatedUser = {
      uid: userDoc.id,
      email: userDoc.data().email,
      apiKey: apiKey
    };
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Gagal memproses autentikasi API: " + err.message });
  }
}

// --- DEVELOPER & INTERNAL API ENDPOINTS ---

// 1. Get or Create User Profile
app.post("/api/users/profile", async (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "ID Pengguna (uid) dan Email harus disediakan." });
  }

  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return res.json(userDocSnap.data());
    } else {
      const apiKey = "pk_" + generateRandomString(24);
      const newProfile = {
        uid,
        email,
        apiKey,
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newProfile);
      return res.status(201).json(newProfile);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal memproses profil pengguna: " + err.message });
  }
});

// 2. Regenerate User API Key
app.post("/api/users/profile/regenerate-key", async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: "ID Pengguna (uid) harus disediakan." });
  }

  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return res.status(404).json({ error: "Profil pengguna tidak ditemukan." });
    }

    const newApiKey = "pk_" + generateRandomString(24);
    await updateDoc(userDocRef, { apiKey: newApiKey });
    
    return res.json({ apiKey: newApiKey });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal memperbarui Token API: " + err.message });
  }
});

// 3. Create a shortlink (Allows API Key OR standard JSON payload)
app.post("/api/links", async (req, res) => {
  let { originalUrl, alias, expiresAt, title, userId } = req.body;

  // Check if API Key is used
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const apiKey = authHeader.substring(7);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("apiKey", "==", apiKey));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: "Token API tidak valid." });
    }
    const userDoc = querySnapshot.docs[0];
    userId = userDoc.id;
    req.body.apiCreated = true;
  }

  // Validate original URL
  if (!originalUrl) {
    return res.status(400).json({ error: "Tautan asli (originalUrl) harus diisi." });
  }
  
  if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
    originalUrl = "https://" + originalUrl;
  }

  try {
    new URL(originalUrl);
  } catch (_) {
    return res.status(400).json({ error: "Format tautan asli tidak valid." });
  }

  // Process alias
  let linkId = alias ? alias.trim() : "";
  if (linkId) {
    // Check reserved aliases
    if (RESERVED_ALIASES.includes(linkId.toLowerCase())) {
      return res.status(400).json({ error: `Alias "${linkId}" merupakan kata sistem dan tidak boleh digunakan.` });
    }

    // Check alias format (alphanumeric and hyphens only)
    const aliasRegex = /^[a-zA-Z0-9-_]+$/;
    if (!aliasRegex.test(linkId)) {
      return res.status(400).json({ error: "Alias hanya boleh terdiri dari huruf, angka, tanda hubung (-), dan garis bawah (_)." });
    }

    // Check if alias already exists
    const linkDocRef = doc(db, "links", linkId);
    const linkDocSnap = await getDoc(linkDocRef);
    if (linkDocSnap.exists()) {
      return res.status(400).json({ error: "Alias sudah digunakan, silakan pilih alias lain." });
    }
  } else {
    // Generate a unique 6-character random string
    let generated = false;
    while (!generated) {
      linkId = generateRandomString(6);
      const testRef = doc(db, "links", linkId);
      const testSnap = await getDoc(testRef);
      if (!testSnap.exists() && !RESERVED_ALIASES.includes(linkId.toLowerCase())) {
        generated = true;
      }
    }
  }

  // Expiration date parsing
  const parsedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

  const newLink = {
    id: linkId,
    originalUrl,
    createdAt: new Date().toISOString(),
    expiresAt: parsedExpiresAt,
    clicks: 0,
    userId: userId || "guest",
    title: title || null,
    apiCreated: !!req.body.apiCreated
  };

  try {
    await setDoc(doc(db, "links", linkId), newLink);
    return res.status(201).json({
      ...newLink,
      shortUrl: `${process.env.APP_URL || "http://localhost:3000"}/${linkId}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal menyimpan tautan pendek: " + err.message });
  }
});

// 4. List links (Allows API Key OR query userId)
app.get("/api/links", async (req, res) => {
  let userId = req.query.userId as string;

  // Check API Key
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const apiKey = authHeader.substring(7);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("apiKey", "==", apiKey));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: "Token API tidak valid." });
    }
    const userDoc = querySnapshot.docs[0];
    userId = userDoc.id;
  }

  if (!userId) {
    return res.status(400).json({ error: "userId atau Bearer Token API diperlukan." });
  }

  try {
    const linksRef = collection(db, "links");
    const q = query(linksRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const linksList = querySnapshot.docs.map(d => ({
      ...d.data(),
      shortUrl: `${process.env.APP_URL || "http://localhost:3000"}/${d.id}`
    }));

    return res.json(linksList);
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal mengambil daftar tautan: " + err.message });
  }
});

// 5. Delete a shortlink (Allows API Key or query/body verification)
app.delete("/api/links/:alias", async (req, res) => {
  const alias = req.params.alias;
  let userId = req.query.userId as string;

  // Check API Key
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const apiKey = authHeader.substring(7);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("apiKey", "==", apiKey));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: "Token API tidak valid." });
    }
    const userDoc = querySnapshot.docs[0];
    userId = userDoc.id;
  }

  if (!alias) {
    return res.status(400).json({ error: "Alias diperlukan." });
  }

  try {
    const linkDocRef = doc(db, "links", alias);
    const linkDocSnap = await getDoc(linkDocRef);

    if (!linkDocSnap.exists()) {
      return res.status(404).json({ error: "Tautan tidak ditemukan." });
    }

    const data = linkDocSnap.data();
    
    // Authorization check (if userId is provided, it must match. Guests can delete their guest links)
    if (userId && data.userId !== userId) {
      return res.status(403).json({ error: "Anda tidak memiliki akses untuk menghapus tautan ini." });
    }

    await deleteDoc(linkDocRef);
    return res.json({ success: true, message: `Tautan "${alias}" berhasil dihapus.` });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal menghapus tautan: " + err.message });
  }
});

// 6. Get link analytics and aggregate metrics (Real-time charts feed)
app.get("/api/analytics/:alias", async (req, res) => {
  const alias = req.params.alias;
  if (!alias) {
    return res.status(400).json({ error: "Alias diperlukan." });
  }

  try {
    const linkDocRef = doc(db, "links", alias);
    const linkDocSnap = await getDoc(linkDocRef);

    if (!linkDocSnap.exists()) {
      return res.status(404).json({ error: "Tautan tidak ditemukan." });
    }

    const linkData = linkDocSnap.data();

    // Query all clicks for this link
    const clicksRef = collection(db, "clicks");
    const q = query(clicksRef, where("linkId", "==", alias), orderBy("timestamp", "asc"));
    const clicksSnapshot = await getDocs(q);

    const rawClicks = clicksSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as any[];

    // 1. Process daily clicks
    const dailyMap: { [key: string]: number } = {};
    // Let's populate the last 7 days at least to make the chart look nice
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dailyMap[dateStr] = 0;
    }

    // 2. Process other dimensions
    const browserMap: { [key: string]: number } = {};
    const osMap: { [key: string]: number } = {};
    const deviceMap: { [key: string]: number } = {};
    const refererMap: { [key: string]: number } = {};

    rawClicks.forEach(click => {
      // Daily click string
      const clickDate = new Date(click.timestamp);
      const dateStr = clickDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;

      // Browser
      const br = click.browser || "Lainnya";
      browserMap[br] = (browserMap[br] || 0) + 1;

      // OS
      const os = click.os || "Lainnya";
      osMap[os] = (osMap[os] || 0) + 1;

      // Device
      const dev = click.device || "Desktop";
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;

      // Referer
      const ref = click.referer || "Langsung / Direct";
      refererMap[ref] = (refererMap[ref] || 0) + 1;
    });

    const dailyClicks = Object.keys(dailyMap).map(key => ({
      date: key,
      clicks: dailyMap[key]
    }));

    const browserStats = Object.keys(browserMap).map(key => ({ name: key, clicks: browserMap[key] }));
    const osStats = Object.keys(osMap).map(key => ({ name: key, clicks: osMap[key] }));
    const deviceStats = Object.keys(deviceMap).map(key => ({ name: key, clicks: deviceMap[key] }));
    const refererStats = Object.keys(refererMap).map(key => ({ name: key, clicks: refererMap[key] }));

    return res.json({
      link: {
        ...linkData,
        shortUrl: `${process.env.APP_URL || "http://localhost:3000"}/${alias}`
      },
      summary: {
        totalClicks: rawClicks.length,
        dailyClicks,
        browserStats,
        osStats,
        deviceStats,
        refererStats,
        rawClicks // Needed for CSV export!
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal mengambil analitik tautan: " + err.message });
  }
});


// --- REDIRECT ROUTE FOR SHORTLINKS ---
app.get("/:alias", async (req, res, next) => {
  const alias = req.params.alias;

  // Exclude static assets and reserved routes
  if (RESERVED_ALIASES.includes(alias.toLowerCase()) || alias.startsWith("_") || alias.includes(".")) {
    return next();
  }

  try {
    const linkDocRef = doc(db, "links", alias);
    const linkDocSnap = await getDoc(linkDocRef);

    if (!linkDocSnap.exists()) {
      return next(); // Let static file serving handle it, or we'll render a custom 404 in client React
    }

    const linkData = linkDocSnap.data();

    // Check expiration date
    if (linkData.expiresAt) {
      const expirationDate = new Date(linkData.expiresAt);
      if (new Date() > expirationDate) {
        // Link expired, send a styled "Expired Link" page
        return res.status(410).send(`
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tautan Kedaluwarsa</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50 text-gray-800 font-sans min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Tautan Telah Kedaluwarsa</h1>
              <p class="text-gray-500 mb-6">Maaf, pembuat tautan ini telah mengatur batas waktu kedaluwarsa otomatis yang saat ini telah terlampaui.</p>
              <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-mono break-all text-gray-400 mb-6">
                Alias: ${alias}
              </div>
              <a href="/" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                Buat Tautan Anda Sendiri
              </a>
            </div>
          </body>
          </html>
        `);
      }
    }

    // Increment click count synchronously in background
    updateDoc(linkDocRef, { clicks: increment(1) }).catch(err => {
      console.error("Gagal menginkremen klik tautan:", err);
    });

    // Parse request headers for analytics
    const uaString = req.headers["user-agent"] || "";
    const refererString = req.headers["referer"] || "";
    const { browser, os, device } = parseUserAgent(uaString);
    const referer = parseReferer(refererString);

    // Save click event in Firestore clicks collection
    const clicksRef = collection(db, "clicks");
    addDoc(clicksRef, {
      linkId: alias,
      timestamp: new Date().toISOString(),
      browser,
      os,
      device,
      referer
    }).catch(err => {
      console.error("Gagal mencatat data klik analitik:", err);
    });

    // Perform redirect to original URL
    return res.redirect(302, linkData.originalUrl);
  } catch (err: any) {
    console.error("Gagal melakukan pengalihan tautan:", err);
    return res.status(500).send("Gagal mengalihkan ke tautan asli.");
  }
});


// --- INTEGRATE VITE FOR SPA ROUTING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start the listening server if we are NOT running in a Vercel Serverless Function
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Express server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
