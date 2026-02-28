# ⚡ Emergency Deployment: Netlify Drop

Since GoDaddy is confusing (or maybe you only bought the Domain and not the Hosting package), we will use **Netlify**. It is free, professional, and **much easier**.

## Step 1: Deploy in 30 Seconds
1.  Open this link: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
2.  Open your File Explorer on your computer.
3.  Navigate to **`C:\Aura\frontend-app\`**.
4.  Find the folder named **`dist`**.
5.  **Drag and Drop** the entire `dist` folder onto the Netlify webpage.
6.  **Wait 10 seconds.** Your site is online! 🟢

## Step 2: Connect `rapha.ltd`
Once deployed, Netlify will give you a random name (like `glowing-stardust-123.netlify.app`).

1.  Click **"Domain Settings"** (or "Set up a custom domain").
2.  Type `rapha.ltd` and click **Verify**.
3.  Click **"Add domain"**.
4.  Netlify will show you **DNS Records** (usually `104.198.14.52` or similar).
    *   *Copy the IP address or nameservers they show you.*

## Step 3: Update GoDaddy DNS (Final Step)
1.  Go back to **GoDaddy**.
2.  Go to **My Products** -> **Domains** -> **Manage DNS** (next to rapha.ltd).
3.  Add the **A Record** or **CNAME** that Netlify gave you.

---
**Summary for right now:** Just do Step 1 (Drag & Drop) and send me the link!
