import express from "express";
import cors from "cors";
import { Storage } from "@google-cloud/storage";
import { LanguageServiceClient } from "@google-cloud/language";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const storage = new Storage();
const language = new LanguageServiceClient();
const bucketName = process.env.EXPORT_BUCKET;
const exportToken = process.env.EXPORT_TOKEN;

app.get("/health", (_req, res) => {
  res.json({ ok: true, bucketConfigured: Boolean(bucketName) });
});

app.post("/export-session", async (req, res) => {
  try {
    if (!bucketName) {
      return res.status(500).send("Missing EXPORT_BUCKET env");
    }

    if (exportToken) {
      const incoming = req.header("x-export-token");
      if (incoming !== exportToken) {
        return res.status(401).send("Invalid export token");
      }
    }

    const payload = req.body || {};
    const sessionId = payload.sessionId || `sess_${Date.now()}`;
    const transcript = payload.transcript || [];
    
    // Perform Sentiment Analysis
    let sentiment = { score: 0, magnitude: 0 };
    if (transcript.length > 0) {
      const fullText = transcript.map(s => s.text).join(" ");
      try {
        const [result] = await language.analyzeSentiment({
          document: { content: fullText, type: "PLAIN_TEXT" }
        });
        sentiment = result.documentSentiment;
      } catch (err) {
        console.error("Sentiment analysis failed:", err.message);
      }
    }

    const ts = Date.now();
    const objectName = `sessions/${sessionId}/transcript-${ts}.json`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    // Save payload with added sentiment
    const finalData = { ...payload, sentiment, exportedAt: ts };
    await file.save(JSON.stringify(finalData, null, 2), {
      contentType: "application/json",
      resumable: false
    });

    res.status(200).json({
      ok: true,
      bucket: bucketName,
      objectName,
      gcsUri: `gs://${bucketName}/${objectName}`,
      sentiment // return sentiment to client for Firebase storage
    });
  } catch (error) {
    if (!res.headersSent) res.status(500).send(error.message || "Export failed");
  }
});

app.post("/stream-audio", (req, res) => {
  try {
    if (!bucketName) return res.status(500).send("Missing EXPORT_BUCKET");
    
    if (exportToken) {
      const incoming = req.header("x-export-token");
      if (incoming !== exportToken) return res.status(401).send("Unauthorized");
    }

    const sessionId = req.query.sessionId || `stream_${Date.now()}`;
    const objectName = `sessions/${sessionId}/audio.webm`;
    
    const file = storage.bucket(bucketName).file(objectName);
    const writeStream = file.createWriteStream({
      contentType: "audio/webm",
      resumable: true
    });

    console.log(`Starting stream for ${objectName}`);
    req.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log(`Stream finished: ${objectName}`);
      res.status(200).send("OK");
    });

    writeStream.on("error", (err) => {
      console.error(`Stream error for ${objectName}: ${err.message}`);
      if (!res.headersSent) res.status(500).send(err.message);
    });
  } catch (error) {
    if (!res.headersSent) res.status(500).send(error.message);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Export service listening on :${port}`);
});

