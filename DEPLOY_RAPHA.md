# 🚀 How to Launch rapha.ltd on GoDaddy

Your website is fully built and ready! 

## 📂 Where are my files?
The "production" files are in this folder:
**`C:\Aura\frontend-app\dist\`**

(You only need the files **inside** this folder, not the source code).

---

## 🛠️ Step-by-Step Upload Guide

### 1. Prepare the Files
1.  Open File Explorer and go to **`C:\Aura\frontend-app\dist\`**.
2.  Select **ALL** files (Ctrl+A).
3.  Right-click -> **Send to** -> **Compressed (zipped) folder**.
4.  Name it `website.zip`.

### 2. Login to GoDaddy
1.  Go to [GoDaddy.com](https://www.godaddy.com) and login.
2.  Go to **My Products**.
3.  Find your **Web Hosting** (Linux or Windows) and click **Manage**.
4.  Look for **cPanel Admin** or **File Manager**.

### 3. Upload
1.  In File Manager, double-click to open **`public_html`** (this is your main website folder).
    *   *Note: If there are existing files like `default.html`, you can delete them.*
2.  Click **Upload** (top bar).
3.  Drag and drop your `website.zip` file here.
4.  Once uploaded, go back to `public_html`.

### 4. Extract
1.  Right-click `website.zip` inside File Manager.
2.  Choose **Extract**.
3.  Extract them directly to `/public_html`.
4.  Delete the `website.zip` file.

### 5. Config (Important!)
Since this is a "Single Page App" (React), you need one special file to prevent "404 Errors" when refreshing pages.
*   **Linux/cPanel:** Create a file named `.htaccess` in `public_html` and paste the code below.
*   **Windows/Plesk:** Create a file named `web.config` in `httpdocs` and paste the code below.

#### Code for `.htaccess` (Linux/cPanel - Most Common)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🎉 Done!
Go to **https://rapha.ltd** and you should see your live Web3 app!
