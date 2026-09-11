package com.chhapola.agriculture;

import android.Manifest;
import android.util.Base64;
import android.util.Log;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
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
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.Bridge;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Chhapola Agriculture — Professional Android App
 *
 * Features:
 *   - Desktop/Mobile Site toggle
 *   - Pull-to-Refresh
 *   - Three-Dot Professional Menu
 *   - File Upload / Camera / Gallery
 *   - Download handling (incl. jsPDF Blob/data-URL PDFs)
 *   - External links
 *   - Loading indicator + Error page with retry
 *   - Network monitoring
 *   - Login/Session preservation
 *   - Back button with double-press exit
 *
 * IMPORTANT: No JavaScript injection into the website.
 * The website's own JS must run without interference.
 */
public class MainActivity extends BridgeActivity {

    /* ── State ────────────────────────────────────────────────── */
    private long lastBackTime = 0;
    private boolean desktopMode = false;
    private boolean isNetworkAvailable = true;

    /* ── User-Agents ──────────────────────────────────────────── */
    private static final String DESKTOP_UA =
            "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private static final String MOBILE_UA =
            "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

    /* ── UI references ────────────────────────────────────────── */
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout errorPage;
    private Toolbar toolbar;
    private MenuItem desktopToggle;

    /* ── File upload ──────────────────────────────────────────── */
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 2001;

    /* ── WebView clients (created once, reused) ──────────────── */
    private ChhapolaWebViewClient webViewClient;
    private ChhapolaChromeClient chromeClient;

    /* ══════════════════════════════════════════════════════════════
       LIFECYCLE
       ══════════════════════════════════════════════════════════════ */

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (savedInstanceState != null) {
            desktopMode = savedInstanceState.getBoolean("desktopMode", false);
        }

        setupCustomViews();
        configureWebView();
        requestPermissionsIfNeeded();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() { handleBackNavigation(); }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        setupCustomViews();
        configureWebView();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean("desktopMode", desktopMode);
    }

    @Override
    public void onDestroy() {
        unregisterNetworkCallback();
        super.onDestroy();
    }

    /* ══════════════════════════════════════════════════════════════
       VIEW SETUP
       ══════════════════════════════════════════════════════════════ */

    private void setupCustomViews() {
        WebView webView = getWebView();
        if (webView == null) return;
        if (swipeRefresh != null) return;

        if (webView.getParent() != null) {
            ((android.view.ViewGroup) webView.getParent()).removeView(webView);
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        // SwipeRefreshLayout
        swipeRefresh = new SwipeRefreshLayout(this);
        swipeRefresh.setColorSchemeColors(
                ContextCompat.getColor(this, R.color.colorPrimary));
        swipeRefresh.setOnRefreshListener(() -> {
            WebView wv = getWebView();
            if (wv != null) wv.reload();
        });
        swipeRefresh.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // Prevent SwipeRefreshLayout from intercepting scroll when WebView
        // content is scrollable (fixes entries not visible after 9th item)
        swipeRefresh.setOnChildScrollUpCallback(
                (parent, child) -> webView.canScrollVertically(-1));

        root.addView(swipeRefresh, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // Toolbar
        toolbar = new Toolbar(this);
        toolbar.setBackgroundColor(
                ContextCompat.getColor(this, R.color.colorPrimary));
        toolbar.setTitleTextColor(Color.WHITE);
        toolbar.setTitle("Chhapola");
        setSupportActionBar(toolbar);

        FrameLayout.LayoutParams toolbarParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dpToPx(56));
        toolbarParams.gravity = android.view.Gravity.TOP;
        root.addView(toolbar, toolbarParams);

        FrameLayout.LayoutParams swipeParams = (FrameLayout.LayoutParams)
                swipeRefresh.getLayoutParams();
        swipeParams.topMargin = dpToPx(56);
        swipeRefresh.setLayoutParams(swipeParams);

        // ProgressBar
        progressBar = new ProgressBar(this, null,
                android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dpToPx(3));
        progressParams.gravity = android.view.Gravity.TOP;
        progressParams.topMargin = dpToPx(56);
        root.addView(progressBar, progressParams);

        // Error page
        errorPage = createErrorPage();
        errorPage.setVisibility(View.GONE);
        FrameLayout.LayoutParams errorParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        errorParams.topMargin = dpToPx(56);
        root.addView(errorPage, errorParams);

        setContentView(root);
        registerNetworkCallback();
        setupWebViewClients();
    }

    private LinearLayout createErrorPage() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(Color.WHITE);
        layout.setPadding(dpToPx(32), dpToPx(32), dpToPx(32), dpToPx(32));

        TextView icon = new TextView(this);
        icon.setText("📡");
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
        sub.setText("कृपया अपना internet connection जाँचें\nऔर फिर से try करें।");
        sub.setTextSize(14);
        sub.setTextColor(Color.parseColor("#666666"));
        sub.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dpToPx(8);
        layout.addView(sub, sp);

        TextView retryBtn = new TextView(this);
        retryBtn.setText("🔄  Retry");
        retryBtn.setTextSize(16);
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setBackgroundColor(
                ContextCompat.getColor(this, R.color.colorPrimary));
        retryBtn.setPadding(dpToPx(32), dpToPx(12), dpToPx(32), dpToPx(12));
        retryBtn.setGravity(android.view.Gravity.CENTER);
        retryBtn.setOnClickListener(v -> {
            WebView wv = getWebView();
            if (wv != null && isNetworkAvailable) wv.reload();
        });
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        rp.topMargin = dpToPx(24);
        layout.addView(retryBtn, rp);

        return layout;
    }

    /* ══════════════════════════════════════════════════════════════
       WEBVIEW CONFIGURATION
       ══════════════════════════════════════════════════════════════ */

    private WebView getWebView() {
        return (getBridge() != null) ? getBridge().getWebView() : null;
    }

    private void configureWebView() {
        WebView webView = getWebView();
        if (webView == null) return;

        WebSettings s = webView.getSettings();

        // Core — essential for Firebase, forms, and interactive features
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowContentAccess(true);

        // Desktop/Mobile toggle
        s.setUserAgentString(desktopMode ? DESKTOP_UA : MOBILE_UA);

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

        // Cookies — essential for Firebase auth sessions
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
    }

    /* ══════════════════════════════════════════════════════════════
       WEBVIEW CLIENTS
       ══════════════════════════════════════════════════════════════ */

    private void setupWebViewClients() {
        WebView webView = getWebView();
        if (webView == null) { Log.e(TAG, "setupWebViewClients: webView is NULL"); return; }

        if (webViewClient == null) {
            webViewClient = new ChhapolaWebViewClient();
        }
        if (chromeClient == null) {
            chromeClient = new ChhapolaChromeClient(getBridge());
        }

        webView.setWebViewClient(webViewClient);
        webView.setWebChromeClient(chromeClient);

        // Register JS bridge for Blob/PDF downloads
        webView.addJavascriptInterface(this, "AndroidBridge");

        webView.setDownloadListener((url, userAgent, contentDisposition,
                                     mimetype, contentLength) -> {
            /*
             * Blob/data URLs (e.g. from jsPDF doc.save()) cannot be resolved
             * via ACTION_VIEW. The jsPDF monkey-patch should have already
             * handled these through the bridge. Fall through for regular
             * HTTP downloads only.
             */
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                // Expected: bridge already handled this via onPdfReady
                return;
            }
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                Toast.makeText(this, "Download started…", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.e(TAG, "DownloadListener: cannot open " + url, e);
                Toast.makeText(this, "Cannot open download link",
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    /* ── WebViewClient ──────────────────────────────────────── */

    private class ChhapolaWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView wv, WebResourceRequest req) {
            String url = req.getUrl().toString();

            if (url.startsWith("tel:")) {
                startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse(url)));
                return true;
            }
            if (url.startsWith("mailto:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)));
                return true;
            }
            if (url.startsWith("sms:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)));
                return true;
            }
            if (url.contains("api.whatsapp.com") || url.contains("wa.me/")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception e) {
                    // ignore
                }
                return true;
            }
            if (url.startsWith("geo:") || url.contains("maps.google")) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
            if (url.contains("play.google.com")) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
            if (!url.contains("chhapolaagriculture.com")
                    && !url.startsWith("about:blank")
                    && req.isForMainFrame()) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception e) { /* ignore */ }
                return true;
            }

            return false;
        }

        @Override
        public void onPageStarted(WebView wv, String url, Bitmap favicon) {
            super.onPageStarted(wv, url, favicon);
            if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
            if (errorPage != null) errorPage.setVisibility(View.GONE);

            // Start polling for jsPDF availability — patches as soon as
            // jsPDF is loaded by the page.
            patchJsPdfOnLoad(wv);
        }

        @Override
        public void onPageFinished(WebView wv, String url) {
            super.onPageFinished(wv, url);
            if (progressBar != null) progressBar.setVisibility(View.GONE);
            if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            if (desktopMode) {
                wv.postDelayed(() -> applyDesktopViewport(wv), 1500);
            }

            // Re-inject jsPDF patch as backup (covers SPA navigation
            // where onPageStarted doesn't fire again).
            patchJsPdfOnLoad(wv);

            // NO DOM repaint workarounds — let website's own show() render
        }

        @Override
        public void onReceivedError(WebView wv, WebResourceRequest req,
                                    WebResourceError error) {
            super.onReceivedError(wv, req, error);
            if (req.isForMainFrame()) {
                if (progressBar != null) progressBar.setVisibility(View.GONE);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (errorPage != null) errorPage.setVisibility(View.VISIBLE);
            }
        }
    }

    /* ── WebChromeClient ────────────────────────────────────── */

    /**
     * Extends Capacitor's BridgeWebChromeClient.
     * JS alert/confirm/prompt dialogs are handled by Capacitor's
     * default BridgeWebChromeClient implementation (standard Android
     * AlertDialog with visible message + buttons).
     */
    private class ChhapolaChromeClient extends BridgeWebChromeClient {

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

            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.CAMERA)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.CAMERA},
                        PERMISSION_REQUEST);
                return true;
            }

            launchFileChooser();
            return true;
        }

        @Override
        public void onProgressChanged(WebView wv, int newProgress) {
            if (progressBar != null) {
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100
                        ? View.GONE : View.VISIBLE);
            }
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin,
                GeolocationPermissions.Callback callback) {
            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.ACCESS_FINE_LOCATION)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                        PERMISSION_REQUEST);
            }
            callback.invoke(origin, true, false);
        }

        @Override
        public boolean onJsAlert(WebView wv, String url, String message,
                                 android.webkit.JsResult result) {
            // Delegate to Capacitor's default dialog — no DOM interference.
            // super.onJsAlert() is BLOCKING: returns after dialog dismiss.
            return super.onJsAlert(wv, url, message, result);
        }

        @Override
        public boolean onJsConfirm(WebView wv, String url, String message,
                                   android.webkit.JsResult result) {
            // Delegate to Capacitor's default dialog — no DOM interference.
            // super.onJsConfirm() is BLOCKING: returns after OK/Cancel.
            return super.onJsConfirm(wv, url, message, result);
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage cm) {
            // Log JS console messages to Logcat so errors/warnings are visible
            // during debugging. Do NOT suppress — let default handling proceed.
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

    /* ══════════════════════════════════════════════════════════════
       PDF DOWNLOAD  —  jsPDF monkey-patch bridge receiver
       ══════════════════════════════════════════════════════════════ */

    /**
     * Sanitize a filename by removing path separators and other
     * characters that are invalid on Android/POSIX filesystems.
     */
    private static String sanitizeFilename(String name) {
        if (name == null || name.isEmpty()) return "document.pdf";
        // Remove path separators, null bytes, and leading/trailing dots/spaces
        return name.replaceAll("[/\\\\:\\x00]", "_")
                   .replaceAll("^\\.+|\\.$", "")
                   .replaceAll("^\\s+|\\s+$", "");
    }

    /**
     * Called from JavaScript when jsPDF's save() fires.
     * {@code dataUrl} is the data-uristring produced by jsPDF
     * (e.g. "data:application/pdf;base64,JVBERi0...").
     * {@code filename} is the name the user passed to doc.save().
     *
     * Save path:
     *   Android 10+  → MediaStore.Downloads (no file-system copy needed)
     *   Android < 10 → External Downloads directory + MediaScanner
     */
    @JavascriptInterface
    public void onPdfReady(String dataUrl, String filename) {
        final String safeName = sanitizeFilename(filename);
        Log.i(TAG, "onPdfReady: filename=" + safeName
                + " dataUrlLen=" + (dataUrl != null ? dataUrl.length() : 0));

        if (dataUrl == null || dataUrl.isEmpty()) {
            Log.e(TAG, "onPdfReady: dataUrl is null or empty");
            return;
        }

        try {
            // Strip the data-URI prefix:  "data:<mime>;base64,<payload>"
            int comma = dataUrl.indexOf(',');
            if (comma < 0) {
                Log.e(TAG, "onPdfReady: no comma in dataUrl — bad format");
                return;
            }
            String base64 = dataUrl.substring(comma + 1);
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);

            if (bytes == null || bytes.length == 0) {
                Log.e(TAG, "onPdfReady: decoded bytes are empty");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // ── Android 10+: MediaStore.Downloads ──
                android.content.ContentValues cv = new android.content.ContentValues();
                cv.put(android.provider.MediaStore.Downloads.DISPLAY_NAME, safeName);
                cv.put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/pdf");
                cv.put(android.provider.MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS);
                cv.put(android.provider.MediaStore.Downloads.IS_PENDING, 1);

                android.net.Uri uri = getContentResolver().insert(
                        android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);

                if (uri == null) {
                    Log.e(TAG, "onPdfReady: MediaStore insert returned null URI");
                    return;
                }

                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) {
                        Log.e(TAG, "onPdfReady: openOutputStream returned null for " + uri);
                        return;
                    }
                    out.write(bytes);
                }

                // Mark as complete
                cv.clear();
                cv.put(android.provider.MediaStore.Downloads.IS_PENDING, 0);
                int updated = getContentResolver().update(uri, cv, null, null);
                Log.i(TAG, "onPdfReady: MediaStore saved " + safeName
                        + " (" + bytes.length + " bytes, rows=" + updated + ")");

            } else {
                // ── Android 9 and below: direct Downloads directory ──
                File dir = Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS);
                if (dir != null && !dir.exists()) dir.mkdirs();
                File outFile = new File(dir != null ? dir : getFilesDir(), safeName);

                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(bytes);
                }

                // Make visible in file managers / gallery
                android.media.MediaScannerConnection.scanFile(
                        this,
                        new String[]{outFile.getAbsolutePath()},
                        new String[]{"application/pdf"},
                        (path, uri) -> Log.i(TAG, "onPdfReady: MediaScanner → " + path));

                Log.i(TAG, "onPdfReady: saved " + outFile.getAbsolutePath()
                        + " (" + bytes.length + " bytes)");
            }

            runOnUiThread(() ->
                    Toast.makeText(this, "✅ PDF saved: " + safeName,
                            Toast.LENGTH_LONG).show());

        } catch (Exception e) {
            Log.e(TAG, "onPdfReady: FAILED", e);
            runOnUiThread(() ->
                    Toast.makeText(this, "❌ PDF save failed: " + e.getMessage(),
                            Toast.LENGTH_LONG).show());
        }
    }

    /* ══════════════════════════════════════════════════════════════
       jsPDF PATCH POLLING  (intercept doc.save() for PDF download)
       ══════════════════════════════════════════════════════════════ */

    /**
     * Poll until jsPDF is available, then patch jsPDF.prototype.save
     * once to route PDF bytes through the AndroidBridge.
     *
     * When the bridge call succeeds, we return without calling the
     * original save — this prevents a duplicate browser-level download.
     * The {@code __pdfBridgeOk} flag tracks whether the bridge received
     * the data so the fallback (origSave) can fire if the bridge is
     * unavailable.
     */
    private void patchJsPdfOnLoad(WebView wv) {
        final String PATCH_JS =
            "(function(){"
            + "if(window.__jspdfPatched||!window.jspdf||!window.jspdf.jsPDF)"
            + "  return false;"
            + "window.__jspdfPatched=true;"
            + "var Orig=window.jspdf.jsPDF;"
            + "var origSave=Orig.prototype.save;"
            + "Orig.prototype.save=function(n){"
            + "  window.__pdfBridgeOk=false;"
            + "  try{"
            + "    var d=this.output('datauristring');"
            + "    if(d&&window.AndroidBridge){"
            + "      window.AndroidBridge.onPdfReady(d,n||'document.pdf');"
            + "      window.__pdfBridgeOk=true;"
            + "    }"
            + "  }catch(e){}"
            + "  if(window.__pdfBridgeOk) return;"
            + "  return origSave.call(this,n);"
            + "};"
            + "return true;"
            + "})()";

        final int[] attempts = {0};
        Runnable poll = new Runnable() {
            @Override
            public void run() {
                WebView wv2 = getWebView();
                if (wv2 == null) return;
                attempts[0]++;
                wv2.evaluateJavascript(PATCH_JS, result -> {
                    if (result == null || !result.contains("true")) {
                        if (attempts[0] < 20) {
                            wv2.postDelayed(this, 500);
                        }
                    }
                });
            }
        };
        wv.postDelayed(poll, 500);
    }

    /* ══════════════════════════════════════════════════════════════
       FILE UPLOAD
       ══════════════════════════════════════════════════════════════ */

    private void launchFileChooser() {
        Intent cameraIntent = new Intent(
                android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

        Intent galleryIntent = new Intent(Intent.ACTION_GET_CONTENT);
        galleryIntent.setType("*/*");
        galleryIntent.addCategory(Intent.CATEGORY_OPENABLE);

        Intent chooser = Intent.createChooser(galleryIntent, "Select File");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,
                new Intent[]{cameraIntent});

        startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILE_CHOOSER_REQUEST && fileUploadCallback != null) {
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
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST && grantResults.length > 0
                && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            launchFileChooser();
        }
    }

    /* ══════════════════════════════════════════════════════════════
       PERMISSIONS
       ══════════════════════════════════════════════════════════════ */

    private void requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.POST_NOTIFICATIONS)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        PERMISSION_REQUEST);
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       THREE-DOT MENU
       ══════════════════════════════════════════════════════════════ */

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, 1, 0, "🔄  Refresh");
        menu.add(0, 2, 1, "⬅️  Back");
        menu.add(0, 3, 2, "➡️  Forward");
        desktopToggle = menu.add(0, 4, 3,
                desktopMode ? "🖥️  Desktop Site: ON" : "📱  Desktop Site: OFF");
        menu.add(0, 5, 4, "🔗  Share");
        menu.add(0, 6, 5, "🔍  Find in Page");
        menu.add(0, 7, 6, "ℹ️  About");
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
                // Desktop toggle — reload page with new settings
                desktopMode = !desktopMode;
                if (desktopToggle != null) {
                    desktopToggle.setTitle(desktopMode
                            ? "🖥️  Desktop Site: ON"
                            : "📱  Desktop Site: OFF");
                }
                webView.reload();
                Toast.makeText(this,
                        desktopMode ? "Desktop Site ON" : "Mobile Site ON",
                        Toast.LENGTH_SHORT).show();
                return true;
            case 5:
                shareCurrentPage();
                return true;
            case 6:
                showFindInPage();
                return true;
            case 7:
                new AlertDialog.Builder(this)
                        .setTitle("Chhapola Agriculture")
                        .setMessage("Version 1.0\n\nAgriculture management app\nchhapolaagriculture.com")
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
        input.setHint("Search on page…");
        input.setImeOptions(EditorInfo.IME_ACTION_SEARCH);

        new AlertDialog.Builder(this)
                .setTitle("Find in Page")
                .setView(input)
                .setPositiveButton("Find", (d, w) -> {
                    String query = input.getText().toString().trim();
                    if (!query.isEmpty()) {
                        WebView webView = getWebView();
                        if (webView != null) webView.findAllAsync(query);
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    /* ══════════════════════════════════════════════════════════════
       BACK BUTTON
       ══════════════════════════════════════════════════════════════ */

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
                        "Back दबाकर app बंद करें", Toast.LENGTH_SHORT).show();
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       NETWORK MONITORING
       ══════════════════════════════════════════════════════════════ */

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
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();
        cm.registerNetworkCallback(request, networkCallback);

        Network active = cm.getActiveNetwork();
        isNetworkAvailable = (active != null);
    }

    private void unregisterNetworkCallback() {
        if (networkCallback != null) {
            ConnectivityManager cm = (ConnectivityManager)
                    getSystemService(CONNECTIVITY_SERVICE);
            if (cm != null) cm.unregisterNetworkCallback(networkCallback);
        }
    }

    private void updateNetworkState() {
        WebView webView = getWebView();
        if (webView == null) return;

        if (isNetworkAvailable) {
            if (errorPage != null) errorPage.setVisibility(View.GONE);
            webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            if (errorPage != null && errorPage.getVisibility() == View.VISIBLE) {
                webView.reload();
            }
        } else {
            webView.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
            if (errorPage != null) errorPage.setVisibility(View.VISIBLE);
        }
    }

    /* ══════════════════════════════════════════════════════════════
       DESKTOP VIEWPORT INJECTION
       ══════════════════════════════════════════════════════════════ */

    /**
     * Override viewport meta tag to force desktop CSS layout.
     * Called with 1500ms delay after page load to avoid breaking
     * the website's own JS event handlers.
     * Only applied in desktop mode.
     */
    private void applyDesktopViewport(WebView wv) {
        try {
            String js = "(function(){"
                    + "try{"
                    + "var vp=document.querySelector('meta[name=viewport]');"
                    + "if(vp){vp.setAttribute('content','width=1200');}"
                    + "else{var m=document.createElement('meta');"
                    + "m.name='viewport';m.content='width=1200';"
                    + "document.head.appendChild(m);}"
                    + "}catch(e){}"
                    + "})()";
            wv.evaluateJavascript(js, null);
        } catch (Exception e) {
            // Silently ignore — don't break the page
        }
    }

    /* ══════════════════════════════════════════════════════════════
       HELPERS
       ══════════════════════════════════════════════════════════════ */

    private static final String TAG = "CHHAPOLA";

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    /**
     * Extract a clean hostname from a URL for dialog title.
     * e.g. "https://chhapolaagriculture.com/something" → "chhapolaagriculture.com"
     */
    private String extractHost(String url) {
        try {
            return Uri.parse(url).getHost();
        } catch (Exception e) {
            return "Chhapola";
        }
    }
}
