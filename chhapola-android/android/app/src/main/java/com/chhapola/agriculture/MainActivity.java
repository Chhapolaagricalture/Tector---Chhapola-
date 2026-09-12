package com.chhapola.agriculture;

import android.Manifest;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.content.ContentValues;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import android.app.DownloadManager;

/**
 * Chhapola Agriculture — Professional Android App
 *
 * Clean WebView wrapper that loads the live website from
 * https://chhapolaagriculture.com/
 *
 * All business logic, Firebase auth, records, PDF generation,
 * AI Munshi, scanner, and all features run inside the website.
 *
 * This Android class provides ONLY native integration:
 *   - Professional toolbar & branding
 *   - Pull-to-Refresh
 *   - Loading indicator & error page
 *   - Back button with double-press exit
 *   - External link handling (tel, mailto, WhatsApp, maps)
 *   - File upload (camera/gallery)
 *   - Network monitoring
 *   - Standard file download handling
 *   - PDF saving via PdfBridge (called from website jsPDF)
 *
 * IMPORTANT: No JavaScript is injected into the website.
 * The website's own JS runs without any interference.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "CHHAPOLA";
    private static final String WEBSITE_URL =
            "https://chhapolaagriculture.com/";

    /* ── State ─────────────────────────────────────────── */
    private long lastBackTime = 0;
    private boolean isNetworkAvailable = true;

    /* ── UI references ─────────────────────────────────── */
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout errorPage;
    private Toolbar toolbar;

    /* ── File upload ───────────────────────────────────── */
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 2001;

    /* ── WebView clients ───────────────────────────────── */
    private ChhapolaWebViewClient webViewClient;
    private ChhapolaChromeClient chromeClient;

    /* ════════════════════════════════════════════════════════
       LIFECYCLE
       ════════════════════════════════════════════════════════ */

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupCustomViews();
        configureWebView();
        setupClients();
        requestPermissionsIfNeeded();

        getOnBackPressedDispatcher().addCallback(this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        handleBackNavigation();
                    }
                });
    }

    @Override
    public void onResume() {
        super.onResume();
        setupCustomViews();
        configureWebView();
    }

    @Override
    public void onDestroy() {
        unregisterNetworkCallback();
        super.onDestroy();
    }

    /* ════════════════════════════════════════════════════════
       VIEW SETUP
       ════════════════════════════════════════════════════════ */

    private WebView getWebView() {
        Bridge bridge = getBridge();
        return bridge != null ? bridge.getWebView() : null;
    }

    private void setupCustomViews() {
        WebView webView = getWebView();
        if (webView == null) return;
        if (swipeRefresh != null) return;

        if (webView.getParent() != null) {
            ((android.view.ViewGroup) webView.getParent())
                    .removeView(webView);
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        /* ── Toolbar ───────────────────────────────────── */
        toolbar = new Toolbar(this);
        toolbar.setBackgroundColor(
                ContextCompat.getColor(this, R.color.colorPrimary));
        toolbar.setTitleTextColor(Color.WHITE);
        toolbar.setTitle("Chhapola");
        setSupportActionBar(toolbar);

        FrameLayout.LayoutParams toolbarParams =
                new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        dpToPx(56));
        toolbarParams.gravity = android.view.Gravity.TOP;
        root.addView(toolbar, toolbarParams);

        /* ── SwipeRefreshLayout ────────────────────────── */
        swipeRefresh = new SwipeRefreshLayout(this);
        swipeRefresh.setColorSchemeColors(
                ContextCompat.getColor(this, R.color.colorPrimary));
        swipeRefresh.setOnRefreshListener(() -> {
            WebView wv = getWebView();
            if (wv != null) wv.reload();
        });

        FrameLayout.LayoutParams swipeParams =
                new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT);
        swipeParams.topMargin = dpToPx(56);
        swipeRefresh.addView(webView, swipeParams);

        /* Prevent SwipeRefreshLayout from intercepting scroll
         * when WebView content is scrollable */
        swipeRefresh.setOnChildScrollUpCallback(
                (parent, child) -> webView.canScrollVertically(-1));

        root.addView(swipeRefresh, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        /* ── Progress bar ─────────────────────────────── */
        progressBar = new ProgressBar(this, null,
                android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams progressParams =
                new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        dpToPx(3));
        progressParams.gravity = android.view.Gravity.TOP;
        progressParams.topMargin = dpToPx(56);
        root.addView(progressBar, progressParams);

        /* ── Error page ───────────────────────────────── */
        errorPage = createErrorPage();
        errorPage.setVisibility(View.GONE);
        FrameLayout.LayoutParams errorParams =
                new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT);
        errorParams.topMargin = dpToPx(56);
        root.addView(errorPage, errorParams);

        setContentView(root);
        registerNetworkCallback();
    }

    private LinearLayout createErrorPage() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(Color.WHITE);
        layout.setPadding(dpToPx(32), dpToPx(32),
                dpToPx(32), dpToPx(32));

        TextView icon = new TextView(this);
        icon.setText("\uD83D\uDCE1");
        icon.setTextSize(48);
        icon.setGravity(android.view.Gravity.CENTER);
        layout.addView(icon);

        TextView title = new TextView(this);
        title.setText("No Internet Connection");
        title.setTextSize(20);
        title.setTextColor(Color.parseColor("#333333"));
        title.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        tp.topMargin = dpToPx(16);
        layout.addView(title, tp);

        TextView sub = new TextView(this);
        sub.setText("\u0915\u0943\u092A\u092F\u093E "
                + "\u0905\u092A\u0928\u093E internet "
                + "connection \u091C\u093E\u0901\u094D\u091A\u0947\u0902"
                + "\n\u0914\u0930 \u092B\u093F\u0930 "
                + "\u0938\u0947 try \u0915\u0930\u0947\u0902\u0964");
        sub.setTextSize(14);
        sub.setTextColor(Color.parseColor("#666666"));
        sub.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dpToPx(8);
        layout.addView(sub, sp);

        TextView retryBtn = new TextView(this);
        retryBtn.setText("\uD83D\uDD04  Retry");
        retryBtn.setTextSize(16);
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setBackgroundColor(
                ContextCompat.getColor(this, R.color.colorPrimary));
        retryBtn.setPadding(dpToPx(32), dpToPx(12),
                dpToPx(32), dpToPx(12));
        retryBtn.setGravity(android.view.Gravity.CENTER);
        retryBtn.setOnClickListener(v -> {
            if (isNetworkAvailable) {
                WebView wv = getWebView();
                if (wv != null) wv.reload();
            }
        });
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        rp.topMargin = dpToPx(24);
        layout.addView(retryBtn, rp);

        return layout;
    }

    /* ════════════════════════════════════════════════════════
       WEBVIEW CONFIGURATION
       ════════════════════════════════════════════════════════ */

    private void configureWebView() {
        WebView webView = getWebView();
        if (webView == null) return;

        WebSettings s = webView.getSettings();

        // Core — essential for Firebase, forms, and interactive features
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowContentAccess(true);

        // User agent — mobile
        s.setUserAgentString(
                "Mozilla/5.0 (Linux; Android 14; Pixel 7) "
                + "AppleWebKit/537.36 (KHTML, like Gecko) "
                + "Chrome/131.0.0.0 Mobile Safari/537.36");

        // Viewport
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);

        // Zoom
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);

        // Cache
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Allow mixed content (some resources might be http)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(
                    WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        // Cookies — essential for Firebase auth sessions
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(webView, true);
    }

    /* ════════════════════════════════════════════════════════
       WEBVIEW CLIENTS
       ════════════════════════════════════════════════════════ */

    private void setupClients() {
        WebView webView = getWebView();
        if (webView == null) {
            Log.e(TAG, "setupClients: webView is NULL");
            return;
        }

        if (webViewClient == null) {
            webViewClient = new ChhapolaWebViewClient();
        }
        if (chromeClient == null) {
            chromeClient = new ChhapolaChromeClient(getBridge());
        }

        webView.setWebViewClient(webViewClient);
        webView.setWebChromeClient(chromeClient);
        webView.setDownloadListener(createDownloadListener());

        // Register PDF bridge — website can call
        // window.AndroidBridge.savePdf(dataUrl, filename)
        webView.addJavascriptInterface(new PdfBridge(), "AndroidBridge");
    }

    /* ── DownloadListener ─────────────────────────────── */

    /**
     * Handles file downloads from the website.
     * - HTTP/HTTPS files → Android DownloadManager
     * - Blob/data URLs from jsPDF → PdfBridge via data URL
     *   (some devices support blob downloads natively;
     *    the bridge handles the rest)
     */
    private DownloadListener createDownloadListener() {
        return (url, userAgent, contentDisposition,
                mimetype, contentLength) -> {

            Log.i(TAG, "Download: " + (url != null
                    ? url.substring(0, Math.min(80, url.length()))
                    : "null")
                    + " | type=" + mimetype);

            /* ── Blob URLs — may fire on some devices ─── */
            if (url != null && url.startsWith("blob:")) {
                handleBlobDownload(url, userAgent,
                        contentDisposition, mimetype);
                return;
            }

            /* ── Data URLs — convert and save ─────────── */
            if (url != null && url.startsWith("data:")) {
                handleDataUrlDownload(url, contentDisposition);
                return;
            }

            /* ── Regular HTTP/HTTPS downloads ─────────── */
            if (url != null && (url.startsWith("http://")
                    || url.startsWith("https://"))) {
                handleHttpDownload(url, userAgent,
                        contentDisposition, mimetype);
                return;
            }

            /* ── Fallback: try to open in browser ─────── */
            try {
                Intent intent = new Intent(
                        Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this,
                        "Cannot open file",
                        Toast.LENGTH_SHORT).show());
            }
        };
    }

    /**
     * Handle blob URL download.
     * Tries DownloadManager first; if it fails (common for
     * blob URLs on some devices), falls back to opening in
     * browser.
     */
    private void handleBlobDownload(String blobUrl,
            String userAgent, String contentDisposition,
            String mimetype) {
        try {
            String fileName = URLUtil.guessFileName(
                    blobUrl, contentDisposition, mimetype);
            if (fileName == null || fileName.isEmpty()) {
                fileName = "download";
            }
            final String finalName = fileName;

            DownloadManager.Request request =
                    new DownloadManager.Request(Uri.parse(blobUrl));
            request.setMimeType(mimetype);
            request.addRequestHeader("User-Agent", userAgent);
            request.setDescription("Downloading " + finalName);
            request.setTitle(finalName);
            request.setNotificationVisibility(
                    DownloadManager.Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS, finalName);

            DownloadManager dm = (DownloadManager)
                    getSystemService(DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                runOnUiThread(() -> Toast.makeText(this,
                        "Downloading " + finalName,
                        Toast.LENGTH_SHORT).show());
            }
        } catch (Exception e) {
            Log.e(TAG, "Blob download failed: " + e.getMessage());
            // Fallback: try to open blob URL in browser
            try {
                Intent intent = new Intent(
                        Intent.ACTION_VIEW, Uri.parse(blobUrl));
                startActivity(intent);
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this,
                        "Cannot download file",
                        Toast.LENGTH_SHORT).show());
            }
        }
    }

    /**
     * Handle data URL download.
     * Decodes data URL (base64) and saves to Downloads.
     */
    private void handleDataUrlDownload(String dataUrl,
            String contentDisposition) {
        try {
            // Parse data URL: data:application/pdf;base64,<data>
            int commaIdx = dataUrl.indexOf(',');
            if (commaIdx < 0) {
                runOnUiThread(() -> Toast.makeText(this,
                        "Invalid data URL",
                        Toast.LENGTH_SHORT).show());
                return;
            }

            String header = dataUrl.substring(0, commaIdx);
            String base64Data = dataUrl.substring(commaIdx + 1);

            // Extract filename from content-disposition or default
            String filename = "document.pdf";
            if (contentDisposition != null
                    && contentDisposition.contains("filename=")) {
                int start = contentDisposition.indexOf("filename=")
                        + 9;
                int end = contentDisposition.indexOf(';', start);
                if (end < 0) end = contentDisposition.length();
                filename = contentDisposition
                        .substring(start, end)
                        .replaceAll("[\"']", "").trim();
            }

            String finalFilename = sanitizeFilename(filename);

            // Decode base64
            byte[] pdfBytes = Base64.decode(base64Data,
                    Base64.DEFAULT);

            // Save to Downloads
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+: use MediaStore
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME,
                        finalFilename);
                values.put(MediaStore.Downloads.MIME_TYPE,
                        "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS);

                Uri uri = getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                        values);
                if (uri != null) {
                    try (OutputStream os =
                            getContentResolver()
                                    .openOutputStream(uri)) {
                        if (os != null) {
                            os.write(pdfBytes);
                            os.flush();
                        }
                    }
                    showPdfSavedToast(finalFilename);
                }
            } else {
                // Android 9 and below
                @SuppressWarnings("deprecation")
                File downloads = Environment
                        .getExternalStoragePublicDirectory(
                                Environment.DIRECTORY_DOWNLOADS);
                File file = new File(downloads, finalFilename);
                try (FileOutputStream fos =
                        new FileOutputStream(file)) {
                    fos.write(pdfBytes);
                    fos.flush();
                }
                showPdfSavedToast(finalFilename);
            }

            Log.i(TAG, "Data URL PDF saved: " + finalFilename
                    + " (" + pdfBytes.length + " bytes)");
        } catch (Exception e) {
            Log.e(TAG, "Data URL download failed: "
                    + e.getMessage(), e);
            runOnUiThread(() -> Toast.makeText(this,
                    "PDF save failed: " + e.getMessage(),
                    Toast.LENGTH_LONG).show());
        }
    }

    /**
     * Handle regular HTTP/HTTPS file download via
     * Android DownloadManager.
     */
    private void handleHttpDownload(String url, String userAgent,
            String contentDisposition, String mimetype) {
        try {
            DownloadManager.Request request =
                    new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimetype);

            String cookies = CookieManager.getInstance()
                    .getCookie(url);
            if (cookies != null) {
                request.addRequestHeader("Cookie", cookies);
            }
            request.addRequestHeader("User-Agent", userAgent);
            request.setDescription("Downloading file...");

            String fileName = URLUtil.guessFileName(
                    url, contentDisposition, mimetype);
            request.setTitle(fileName);
            request.setNotificationVisibility(
                    DownloadManager.Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager dm = (DownloadManager)
                    getSystemService(DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                runOnUiThread(() -> Toast.makeText(this,
                        "Downloading " + fileName,
                        Toast.LENGTH_SHORT).show());
            }
        } catch (Exception e) {
            Log.e(TAG, "HTTP download failed: " + e.getMessage());
            try {
                Intent intent = new Intent(
                        Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this,
                        "Cannot download file",
                        Toast.LENGTH_SHORT).show());
            }
        }
    }

    /* ── WebViewClient ────────────────────────────────── */

    private class ChhapolaWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView wv,
                WebResourceRequest req) {
            String url = req.getUrl().toString();

            if (url.startsWith("tel:")) {
                startActivity(new Intent(Intent.ACTION_DIAL,
                        Uri.parse(url)));
                return true;
            }
            if (url.startsWith("mailto:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO,
                        Uri.parse(url)));
                return true;
            }
            if (url.startsWith("sms:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO,
                        Uri.parse(url)));
                return true;
            }
            if (url.contains("api.whatsapp.com")
                    || url.contains("wa.me/")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse(url)));
                } catch (Exception e) { /* ignore */ }
                return true;
            }
            if (url.startsWith("geo:")
                    || url.contains("maps.google")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse(url)));
                } catch (Exception e) { /* ignore */ }
                return true;
            }
            if (url.contains("play.google.com")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse(url)));
                } catch (Exception e) { /* ignore */ }
                return true;
            }
            // External links — open in browser
            if (!url.contains("chhapolaagriculture.com")
                    && !url.startsWith("about:blank")
                    && req.isForMainFrame()) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse(url)));
                } catch (Exception e) { /* ignore */ }
                return true;
            }

            return false;
        }

        @Override
        public void onPageStarted(WebView wv, String url,
                Bitmap favicon) {
            super.onPageStarted(wv, url, favicon);
            if (progressBar != null)
                progressBar.setVisibility(View.VISIBLE);
            if (errorPage != null)
                errorPage.setVisibility(View.GONE);
        }

        @Override
        public void onPageFinished(WebView wv, String url) {
            super.onPageFinished(wv, url);
            if (progressBar != null)
                progressBar.setVisibility(View.GONE);
            if (swipeRefresh != null)
                swipeRefresh.setRefreshing(false);
        }

        @Override
        public void onReceivedError(WebView wv,
                WebResourceRequest req, WebResourceError error) {
            super.onReceivedError(wv, req, error);
            if (req.isForMainFrame()) {
                if (progressBar != null)
                    progressBar.setVisibility(View.GONE);
                if (swipeRefresh != null)
                    swipeRefresh.setRefreshing(false);
                if (errorPage != null)
                    errorPage.setVisibility(View.VISIBLE);
            }
        }
    }

    /* ── WebChromeClient ──────────────────────────────── */

    /**
     * Extends Capacitor's BridgeWebChromeClient.
     * JS alert/confirm/prompt dialogs are handled by
     * Capacitor's default BridgeWebChromeClient
     * (standard Android AlertDialog).
     * No custom dialog or DOM interference.
     */
    private class ChhapolaChromeClient
            extends BridgeWebChromeClient {

        ChhapolaChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onShowFileChooser(WebView wv,
                ValueCallback<Uri[]> callback,
                FileChooserParams params) {
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
            }
            fileUploadCallback = callback;

            if (ContextCompat.checkSelfPermission(
                    MainActivity.this, Manifest.permission.CAMERA)
                    != android.content.pm.PackageManager
                            .PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.CAMERA},
                        PERMISSION_REQUEST);
                return true;
            }

            launchFileChooser();
            return true;
        }

        @Override
        public void onProgressChanged(WebView wv,
                int newProgress) {
            if (progressBar != null) {
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100
                        ? View.GONE : View.VISIBLE);
            }
        }

        @Override
        public boolean onJsAlert(WebView wv, String url,
                String message, JsResult result) {
            // Let Capacitor's default AlertDialog handle it
            return super.onJsAlert(wv, url, message, result);
        }

        @Override
        public boolean onJsConfirm(WebView wv, String url,
                String message, JsResult result) {
            // Let Capacitor's default AlertDialog handle it
            return super.onJsConfirm(wv, url, message, result);
        }

        @Override
        public boolean onConsoleMessage(
                android.webkit.ConsoleMessage cm) {
            if (cm != null) {
                String level = cm.messageLevel() != null
                        ? cm.messageLevel().name() : "UNKNOWN";
                Log.i(TAG, "[JS:" + level + "] "
                        + cm.message()
                        + " (source: " + cm.sourceId()
                        + " line " + cm.lineNumber() + ")");
            }
            return super.onConsoleMessage(cm);
        }
    }

    /* ════════════════════════════════════════════════════════
       PDF BRIDGE — called by website jsPDF
       ════════════════════════════════════════════════════════ */

    /**
     * JavaScript interface for the website to call when
     * generating PDF files.
     *
     * Usage from website JavaScript:
     *   var dataUrl = doc.output('datauristring');
     *   window.AndroidBridge.savePdf(dataUrl, 'filename.pdf');
     *
     * This is NOT a monkey-patch of jsPDF. The website's
     * existing PDF code continues to work exactly as before.
     * This bridge simply provides a clean Android-native
     * path for saving files that the browser can't download.
     */
    public class PdfBridge {

        /**
         * Save a PDF from a data URL to the device's
         * Downloads folder.
         *
         * @param dataUrl  Base64-encoded PDF as data URL
         * @param filename Target filename
         */
        @android.webkit.JavascriptInterface
        public void savePdf(String dataUrl, String filename) {
            Log.i(TAG, "[PdfBridge] savePdf called: "
                    + filename);
            try {
                if (dataUrl == null || dataUrl.isEmpty()) {
                    Log.e(TAG, "[PdfBridge] dataUrl is null/empty");
                    return;
                }

                // Parse data URL
                int commaIdx = dataUrl.indexOf(',');
                if (commaIdx < 0) {
                    Log.e(TAG, "[PdfBridge] Invalid data URL format");
                    return;
                }

                String base64Data = dataUrl.substring(commaIdx + 1);
                String safeName = sanitizeFilename(
                        filename != null && !filename.isEmpty()
                                ? filename : "document.pdf");

                // Decode base64
                byte[] pdfBytes = Base64.decode(base64Data,
                        Base64.DEFAULT);
                Log.i(TAG, "[PdfBridge] Decoded " + pdfBytes.length
                        + " bytes for: " + safeName);

                // Save to Downloads
                if (Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.Q) {
                    saveWithMediaStore(safeName, pdfBytes);
                } else {
                    saveLegacy(safeName, pdfBytes);
                }

                Log.i(TAG, "[PdfBridge] PDF saved successfully: "
                        + safeName);
                runOnUiThread(() -> showPdfSavedToast(safeName));

            } catch (Exception e) {
                Log.e(TAG, "[PdfBridge] Save failed: "
                        + e.getMessage(), e);
                runOnUiThread(() -> Toast.makeText(
                        getApplicationContext(),
                        "PDF save failed: " + e.getMessage(),
                        Toast.LENGTH_LONG).show());
            }
        }

        private void saveWithMediaStore(String name, byte[] data)
                throws Exception {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, name);
            values.put(MediaStore.Downloads.MIME_TYPE,
                    "application/pdf");
            values.put(MediaStore.Downloads.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS);

            Uri uri = getContentResolver().insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    values);
            if (uri == null) {
                throw new RuntimeException(
                        "MediaStore insert returned null");
            }
            try (OutputStream os =
                    getContentResolver().openOutputStream(uri)) {
                if (os == null) {
                    throw new RuntimeException(
                            "openOutputStream returned null");
                }
                os.write(data);
                os.flush();
            }
        }

        @SuppressWarnings("deprecation")
        private void saveLegacy(String name, byte[] data)
                throws Exception {
            File downloads = Environment
                    .getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_DOWNLOADS);
            File file = new File(downloads, name);
            try (FileOutputStream fos =
                    new FileOutputStream(file)) {
                fos.write(data);
                fos.flush();
            }
        }
    }

    private void showPdfSavedToast(String filename) {
        Toast.makeText(this,
                "PDF saved: " + filename + "\n"
                + "Downloads folder",
                Toast.LENGTH_LONG).show();
    }

    /* ════════════════════════════════════════════════════════
       FILE UPLOAD
       ════════════════════════════════════════════════════════ */

    private void launchFileChooser() {
        Intent cameraIntent = new Intent(
                MediaStore.ACTION_IMAGE_CAPTURE);

        Intent galleryIntent = new Intent(
                Intent.ACTION_GET_CONTENT);
        galleryIntent.setType("*/*");
        galleryIntent.addCategory(Intent.CATEGORY_OPENABLE);

        Intent chooser = Intent.createChooser(galleryIntent,
                "Select File");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,
                new Intent[]{cameraIntent});

        startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode,
            int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILE_CHOOSER_REQUEST
                && fileUploadCallback != null) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
            String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode,
                permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST
                && grantResults.length > 0
                && grantResults[0]
                        == android.content.pm.PackageManager
                                .PERMISSION_GRANTED) {
            launchFileChooser();
        }
    }

    /* ════════════════════════════════════════════════════════
       PERMISSIONS
       ════════════════════════════════════════════════════════ */

    private void requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.POST_NOTIFICATIONS)
                    != android.content.pm.PackageManager
                            .PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{
                                Manifest.permission
                                        .POST_NOTIFICATIONS},
                        PERMISSION_REQUEST);
            }
        }
    }

    /* ════════════════════════════════════════════════════════
       THREE-DOT MENU
       ════════════════════════════════════════════════════════ */

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, 1, 0, "\uD83D\uDD04  Refresh");
        menu.add(0, 2, 1, "\u2B05\uFE0F  Back");
        menu.add(0, 3, 2, "\u27A1\uFE0F  Forward");
        menu.add(0, 4, 3, "\uD83D\uDD17  Share");
        menu.add(0, 5, 4, "\uD83D\uDD0D  Find in Page");
        menu.add(0, 6, 5, "\u2139\uFE0F  About");
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        WebView webView = getWebView();
        if (webView == null) return true;

        switch (item.getItemId()) {
            case 1:
                webView.reload();
                return true;
            case 2:
                if (webView.canGoBack()) webView.goBack();
                return true;
            case 3:
                if (webView.canGoForward()) webView.goForward();
                return true;
            case 4:
                shareCurrentPage();
                return true;
            case 5:
                showFindInPage();
                return true;
            case 6:
                new AlertDialog.Builder(this)
                        .setTitle("Chhapola Agriculture")
                        .setMessage("Version 1.0\n\n"
                                + "Agriculture management app\n"
                                + "chhapolaagriculture.com")
                        .setPositiveButton("OK", null)
                        .show();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    private void shareCurrentPage() {
        WebView webView = getWebView();
        if (webView == null) return;
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("text/plain");
        share.putExtra(Intent.EXTRA_TEXT, webView.getUrl());
        startActivity(Intent.createChooser(share, "Share via"));
    }

    private void showFindInPage() {
        EditText input = new EditText(this);
        input.setHint("Search on page\u2026");
        input.setImeOptions(EditorInfo.IME_ACTION_SEARCH);

        new AlertDialog.Builder(this)
                .setTitle("Find in Page")
                .setView(input)
                .setPositiveButton("Find", (d, w) -> {
                    String query = input.getText().toString()
                            .trim();
                    if (!query.isEmpty()) {
                        WebView webView = getWebView();
                        if (webView != null)
                            webView.findAllAsync(query);
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    /* ════════════════════════════════════════════════════════
       BACK BUTTON
       ════════════════════════════════════════════════════════ */

    private void handleBackNavigation() {
        WebView webView = getWebView();
        if (webView == null) { finish(); return; }

        webView.clearMatches();

        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            long now = System.currentTimeMillis();
            if (now - lastBackTime < 2500) {
                finish();
            } else {
                lastBackTime = now;
                Toast.makeText(this,
                        "Back \u0926\u092C\u093E\u0915\u0930 "
                        + "\u0905\u092B \u092C\u0902\u0926 "
                        + "\u0915\u0930\u0947\u0902",
                        Toast.LENGTH_SHORT).show();
            }
        }
    }

    /* ════════════════════════════════════════════════════════
       NETWORK MONITORING
       ════════════════════════════════════════════════════════ */

    private ConnectivityManager.NetworkCallback networkCallback;

    private void registerNetworkCallback() {
        ConnectivityManager cm = (ConnectivityManager)
                getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return;

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    isNetworkAvailable = true;
                    updateNetworkState();
                });
            }
            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    isNetworkAvailable = false;
                    updateNetworkState();
                });
            }
        };

        NetworkRequest request = new NetworkRequest.Builder()
                .addCapability(
                        NetworkCapabilities
                                .NET_CAPABILITY_INTERNET)
                .build();
        cm.registerNetworkCallback(request, networkCallback);

        Network active = cm.getActiveNetwork();
        isNetworkAvailable = (active != null);
    }

    private void unregisterNetworkCallback() {
        if (networkCallback != null) {
            ConnectivityManager cm = (ConnectivityManager)
                    getSystemService(CONNECTIVITY_SERVICE);
            if (cm != null) {
                cm.unregisterNetworkCallback(networkCallback);
            }
        }
    }

    private void updateNetworkState() {
        WebView webView = getWebView();
        if (webView == null) return;

        if (isNetworkAvailable) {
            if (errorPage != null)
                errorPage.setVisibility(View.GONE);
            webView.getSettings().setCacheMode(
                    WebSettings.LOAD_DEFAULT);
            // Auto-reload when network returns
            if (errorPage != null
                    && errorPage.getVisibility()
                            == View.VISIBLE) {
                webView.reload();
            }
        } else {
            webView.getSettings().setCacheMode(
                    WebSettings.LOAD_CACHE_ELSE_NETWORK);
            if (errorPage != null)
                errorPage.setVisibility(View.VISIBLE);
        }
    }

    /* ════════════════════════════════════════════════════════
       HELPERS
       ════════════════════════════════════════════════════════ */

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics()
                .density);
    }

    /**
     * Sanitize filename for safe storage.
     * Removes path separators, null bytes, leading dots.
     */
    private static String sanitizeFilename(String name) {
        if (name == null || name.isEmpty()) {
            return "document.pdf";
        }
        // Remove path separators and dangerous chars
        String safe = name
                .replaceAll("[/\\\\:*?\"<>|]", "_")
                .replaceAll("\\x00", "")
                .replaceAll("^\\.+", "");
        if (safe.isEmpty()) safe = "document.pdf";
        return safe;
    }
}
