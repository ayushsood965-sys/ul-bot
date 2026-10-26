# Troubleshooting Guide — The Verdict Room Studio

This guide provides fast remedies for common operational issues encountered in development or production.

---

## 1. Meta / Instagram Graph API Issues

### Issue A: "Error validating access token: Session has expired" (Code 190)
- **Cause**: The Meta User Token or Page Token has expired or permissions were modified.
- **Remedy**:
  1. Open Meta Graph API Explorer or your System User Token Generator.
  2. Generate a fresh Page Access Token with `instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement`.
  3. Update `INSTAGRAM_ACCESS_TOKEN` in `.env` or via **Instagram / Meta API** in the Studio dashboard.

### Issue B: "Media container processing error: status_code ERROR"
- **Cause**: Meta could not download or validate the rendered image URL, or the asset URL was not publicly reachable via HTTPS.
- **Remedy**:
  1. Ensure your server URL is an accessible public HTTPS address (`APP_URL` in `.env`).
  2. For local testing without a public domain, enable **Safe Mock Mode** in the dashboard to test the complete scheduling and rendering lifecycle safely.

### Issue C: "User has reached publishing limit" (Code 32)
- **Cause**: Instagram enforces a 25 posts / 24-hour publishing limit per Instagram Business account.
- **Remedy**:
  1. Engage the **Emergency Publishing Stop** in the dashboard.
  2. Lower the daily target in Automation Settings (default: 5/day).
  3. Ensure the minimum rate spacing remains at 300 seconds (5 minutes).

---

## 2. AI Provider & Generation Issues

### Issue A: "Gemini API error (429): Resource has been exhausted"
- **Behavior**: The studio automatically triggers the **OpenRouter cascade fallback** without crashing!
- **Remedy**:
  1. Verify in Activity Logs that the OpenRouter fallback took over.
  2. Check your Gemini API quota in Google AI Studio.
  3. Upgrade to Gemini Pay-As-You-Go if free tier RPM limits are hit.

### Issue B: "Content flagged for PII / Harassment"
- **Behavior**: Post is routed to **Needs Review** status instead of being approved.
- **Remedy**:
  1. Navigate to **Moderation & Safety** in the dashboard.
  2. Inspect the flag reasons (e.g., unredacted phone numbers, Aadhaar, defamation trigger words).
  3. Use the redaction editor to sanitize or reject the submission.

---

## 3. Background Worker & Queue Issues

### Issue A: "Worker status offline or standby"
- **Cause**: The background worker process is not currently running.
- **Remedy**:
  1. In development, open a second terminal and run:
     ```bash
     npm run worker
     ```
  2. In production with Docker, check:
     ```bash
     docker compose ps worker
     docker compose logs worker
     ```
  3. In production with PM2, check:
     ```bash
     pm2 status tvr-worker
     pm2 restart tvr-worker
     ```

### Issue B: "Stale or claimed jobs stuck after power outage or reboot"
- **Behavior**: The worker automatically runs `recoverStaleJobs()` upon startup and resets any orphaned jobs back to `SCHEDULED` status!
- **Manual Remedy**: You can also click **Process Ready Jobs Now** in the Publishing Queue dashboard view to trigger a manual claim and execution cycle.
