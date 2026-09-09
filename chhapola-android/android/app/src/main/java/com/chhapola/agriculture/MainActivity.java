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
 *   - Post-dialog DOM reflow for records list
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

    /* ── Records reflow flag ────────────────────────────────── */
    private boolean pendingReflow = false;

    /* ── Diagnostic: log DOM state after each dialog dismiss ── */
    private void logDomState(String trigger, WebView wv) {
        String js = "(function(){"
            + "var info={};"
            + "info.recordsLength=(window.records?window.records.length:-1);"
            + "info.listExists=(document.getElementById('list')!=null);"
            + "var listEl=document.getElementById('list');"
            + "info.listInnerHtmlLen=listEl?listEl.innerHTML.length:0;"
            + "info.listInnerText=listEl?(listEl.innerText||'').substring(0,500):'';"
            + "info.listDisplay=listEl?listEl.style.display:'N/A';"
            + "info.listOffsetHeight=listEl?listEl.offsetHeight:0;"
            + "info.listOffsetWidth=listEl?listEl.offsetWidth:0;"
            + "info.listRect=listEl?JSON.parse(JSON.stringify(listEl.getBoundingClientRect())):{height:0,width:0};"
            + "info.listFirstCard=(listEl&&listEl.innerHTML)?listEl.innerHTML.substring(0,500):'';"
            + "info.trigger='" + trigger + "';"
            + "info.timestamp=new Date().toISOString();"
            + "console.log('[CHHAPOLA-DIAG] '+JSON.stringify(info));"
            + "return JSON.stringify(info);"
            + "})()";
        wv.evaluateJavascript(js, result -> {
            Log.i(TAG, "[DIAG-DOM] " + trigger + " → " + result);
        });
    }

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
        Log.i(TAG, "[DIAG-BRIDGE] AndroidBridge registered on WebView");

        webView.setDownloadListener((url, userAgent, contentDisposition,
                                     mimetype, contentLength) -> {
            Log.i(TAG, "[DIAG-DOWNLOAD] DownloadListener fired: url=" + url
                    + " mime=" + mimetype + " length=" + contentLength);
            /*
             * Blob/data URLs (e.g. from jsPDF doc.save()) cannot be resolved
             * via ACTION_VIEW. The jsPDF monkey-patch in onPageStarted should
             * have already handled these through the bridge. Fall through for
             * regular HTTP downloads.
             */
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                Log.i(TAG, "[DIAG-DOWNLOAD] blob/data URL intercepted — expecting bridge to handle");
                return;
            }
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                Toast.makeText(this, "Download started…", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.e(TAG, "[DIAG-DOWNLOAD] Cannot open download link", e);
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
            Log.i(TAG, "[DIAG-PAGE] onPageStarted: " + url);
            if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
            if (errorPage != null) errorPage.setVisibility(View.GONE);

            // Start polling for jsPDF availability — patches as soon as
            // jsPDF is loaded by the page, replacing the unreliable
            // one-shot + 1s-delay approach.
            patchJsPdfOnLoad(wv);
        }

        @Override
        public void onPageFinished(WebView wv, String url) {
            super.onPageFinished(wv, url);
            Log.i(TAG, "[DIAG-PAGE] onPageFinished: " + url);
            if (progressBar != null) progressBar.setVisibility(View.GONE);
            if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            if (desktopMode) {
                wv.postDelayed(() -> applyDesktopViewport(wv), 1500);
            }

            // Inject MutationObserver to force repaint when #list content
            // changes after async show() completes.
            injectListRepaintObserver(wv);

            // Also re-inject jsPDF patch as backup (covers SPA navigation
            // where onPageStarted doesn't fire again).
            patchJsPdfOnLoad(wv);

            // Safety-net reflow
            if (pendingReflow) {
                pendingReflow = false;
                postAlertReflow();
            }

            // Log DOM state on page finish (initial state)
            wv.postDelayed(() -> logDomState("PAGE-FINISHED+2s", wv), 2000);
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
            Log.i(TAG, "[DIAG-ALERT] onJsAlert fired: message=" + message);
            pendingReflow = true;
            // Ensure MutationObserver is active (may have been lost on
            // SPA navigation or WebView recreation).
            injectListRepaintObserver(wv);

            // Log DOM state BEFORE dialog shows (snapshot)
            logDomState("ALERT-BEFORE", wv);

            // super.onJsAlert() is BLOCKING — returns after dialog dismiss.
            boolean handled = super.onJsAlert(wv, url, message, result);

            Log.i(TAG, "[DIAG-ALERT] Dialog dismissed. Scheduling DOM checks...");

            // Log DOM state immediately after dialog dismiss (show() may still be running)
            logDomState("ALERT-IMMEDIATE", wv);

            // Log at 300ms — show() Firestore query likely completed
            wv.postDelayed(() -> {
                logDomState("ALERT+300ms", wv);
                triggerListReflow(wv);
            }, 300);

            // Log at 1s — should be fully rendered
            wv.postDelayed(() -> {
                logDomState("ALERT+1s", wv);
                triggerListReflow(wv);
            }, 1000);

            // Log at 2s — final check
            wv.postDelayed(() -> logDomState("ALERT+2s", wv), 2000);

            return handled;
        }

        @Override
        public boolean onJsConfirm(WebView wv, String url, String message,
                                   android.webkit.JsResult result) {
            Log.i(TAG, "[DIAG-CONFIRM] onJsConfirm fired: message=" + message);
            pendingReflow = true;
            injectListRepaintObserver(wv);

            logDomState("CONFIRM-BEFORE", wv);

            // super.onJsConfirm() is BLOCKING — returns after OK/Cancel.
            boolean handled = super.onJsConfirm(wv, url, message, result);

            Log.i(TAG, "[DIAG-CONFIRM] Dialog dismissed. Scheduling DOM checks...");

            logDomState("CONFIRM-IMMEDIATE", wv);

            wv.postDelayed(() -> {
                logDomState("CONFIRM+300ms", wv);
                triggerListReflow(wv);
            }, 300);

            wv.postDelayed(() -> {
                logDomState("CONFIRM+1s", wv);
                triggerListReflow(wv);
            }, 1000);

            wv.postDelayed(() -> logDomState("CONFIRM+2s", wv), 2000);

            return handled;
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage cm) {
            return true;
        }
    }

    /* ══════════════════════════════════════════════════════════════
       PDF DOWNLOAD  —  jsPDF monkey-patch bridge receiver
       ══════════════════════════════════════════════════════════════ */

    /**
     * Called from JavaScript when jsPDF's save() fires.
     * {@code dataUrl} is the data-uristring produced by jsPDF
     * (e.g. "data:application/pdf;base64,JVBERi0...").
     * {@code filename} is the name the user passed to doc.save().
     */
    @JavascriptInterface
    public void onPdfReady(String dataUrl, String filename) {
        Log.i(TAG, "[DIAG-PDF] ═══ onPdfReady ENTERED ═══ filename=" + filename);
        Log.i(TAG, "[DIAG-PDF] dataUrl length=" + (dataUrl != null ? dataUrl.length() : "NULL"));
        Log.i(TAG, "[DIAG-PDF] dataUrl prefix=" + (dataUrl != null ? dataUrl.substring(0, Math.min(80, dataUrl.length())) : "NULL"));

        try {
            // Strip the data-URI prefix:  "data:<mime>;base64,<payload>"
            int comma = dataUrl.indexOf(',');
            if (comma < 0) {
                Log.e(TAG, "[DIAG-PDF] FAIL: no comma in dataUrl — bad format");
                return;
            }
            String base64 = dataUrl.substring(comma + 1);
            Log.i(TAG, "[DIAG-PDF] Base64 payload length=" + base64.length());

            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            Log.i(TAG, "[DIAG-PDF] Base64 decoded → bytes length=" + bytes.length);

            // Choose save location
            File dir;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                dir = new File(getFilesDir(), "downloads");
                Log.i(TAG, "[DIAG-PDF] Android Q+ → internal dir: " + dir.getAbsolutePath());
            } else {
                dir = Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS);
                Log.i(TAG, "[DIAG-PDF] Pre-Q → external dir: " + (dir != null ? dir.getAbsolutePath() : "NULL"));
            }
            if (dir != null && !dir.exists()) {
                boolean created = dir.mkdirs();
                Log.i(TAG, "[DIAG-PDF] dir.mkdirs()=" + created);
            }
            File outFile = new File(dir != null ? dir : getFilesDir(), filename);
            Log.i(TAG, "[DIAG-PDF] outFile: " + outFile.getAbsolutePath());

            // Write to file
            FileOutputStream fos = new FileOutputStream(outFile);
            fos.write(bytes);
            fos.close();
            Log.i(TAG, "[DIAG-PDF] ✅ File write SUCCESS: " + outFile.getAbsolutePath() + " (" + bytes.length + " bytes)");

            // Make it visible in the Gallery / Files app
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Log.i(TAG, "[DIAG-PDF] Attempting MediaStore insert (Android Q+)...");
                android.content.ContentValues cv = new android.content.ContentValues();
                cv.put(android.provider.MediaStore.Downloads.DISPLAY_NAME, filename);
                cv.put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/pdf");
                cv.put(android.provider.MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS);
                cv.put(android.provider.MediaStore.Downloads.IS_PENDING, 1);
                android.net.Uri uri = getContentResolver().insert(
                        android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri != null) {
                    Log.i(TAG, "[DIAG-PDF] MediaStore URI obtained: " + uri);
                    OutputStream out = getContentResolver().openOutputStream(uri);
                    if (out != null) {
                        out.write(bytes);
                        out.close();
                        Log.i(TAG, "[DIAG-PDF] ✅ MediaStore write SUCCESS");
                    } else {
                        Log.e(TAG, "[DIAG-PDF] FAIL: openOutputStream returned null for URI " + uri);
                    }
                    cv.clear();
                    cv.put(android.provider.MediaStore.Downloads.IS_PENDING, 0);
                    int updated = getContentResolver().update(uri, cv, null, null);
                    Log.i(TAG, "[DIAG-PDF] MediaStore update IS_PENDING=0 → rows=" + updated);
                } else {
                    Log.e(TAG, "[DIAG-PDF] FAIL: MediaStore insert returned null URI");
                }
            } else {
                Log.i(TAG, "[DIAG-PDF] Pre-Q: scanning file with MediaScanner...");
                android.media.MediaScannerConnection.scanFile(
                        this, new String[]{outFile.getAbsolutePath()},
                        new String[]{"application/pdf"}, (path, uri) ->
                            Log.i(TAG, "[DIAG-PDF] MediaScanner callback: path=" + path + " uri=" + uri)
                );
            }

            Log.i(TAG, "[DIAG-PDF] ═══ onPdfReady COMPLETE ═══");
            runOnUiThread(() -> Toast.makeText(this,
                    "PDF saved: " + filename, Toast.LENGTH_LONG).show());
        } catch (Exception e) {
            Log.e(TAG, "[DIAG-PDF] ═══ onPdfReady FAILED ═══", e);
            runOnUiThread(() -> Toast.makeText(this,
                    "PDF save failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
        }
    }

    /* ══════════════════════════════════════════════════════════════
       DOM RE-FLOW HELPERS  (fixes records list not rendering)
       ══════════════════════════════════════════════════════════════ */

    /**
     * Safety-net reflow for onPageFinished.
     */
    private void postAlertReflow() {
        WebView webView = getWebView();
        if (webView == null) return;
        triggerListReflow(webView);
    }

    /**
     * Force a DOM repaint of the records list element by toggling
     * display. Used as a fallback alongside the MutationObserver.
     */
    private void triggerListReflow(WebView wv) {
        String js = "(function(){"
            + "var el=document.getElementById('list');"
            + "if(!el)return;"
            + "el.style.display='none';"
            + "void el.offsetHeight;"
            + "el.style.display='';"
            + "})()";
        wv.evaluateJavascript(js, null);
    }

    /**
     * Inject a MutationObserver that watches the #list element for
     * DOM changes (childList, subtree, characterData) and forces a
     * WebView repaint. This is the PRIMARY fix for records not showing:
     * show() is async and awaits Firestore — the timed reflows fire
     * before the DOM is updated. The observer reacts to the exact
     * moment the DOM changes, regardless of timing.
     *
     * Injected from onPageFinished (initial load) and from
     * onJsAlert/onJsConfirm (safety — in case observer was lost).
     */
    private void injectListRepaintObserver(WebView wv) {
        String js = "(function(){"
            + "if(window.__listRepaintObserver)return;"
            + "var list=document.getElementById('list');"
            + "if(!list)return;"
            + "window.__listRepaintObserver=true;"
            + "new MutationObserver(function(){"
            + "  var el=document.getElementById('list');"
            + "  if(!el)return;"
            + "  el.style.display='none';"
            + "  void el.offsetHeight;"
            + "  el.style.display='';"
            + "}).observe(list,{childList:true,subtree:true,characterData:true});"
            + "})()";
        wv.evaluateJavascript(js, null);
    }

    /* ══════════════════════════════════════════════════════════════
       jsPDF PATCH POLLING  (intercept doc.save() for PDF download)
       ══════════════════════════════════════════════════════════════ */

    /**
     * Poll until jsPDF is available, then patch jsPDF.prototype.save
     * once to route PDF bytes through the AndroidBridge.  Retries
     * every 500ms for up to 10 seconds (20 attempts).
     */
    private void patchJsPdfOnLoad(WebView wv) {
        final String PATCH_JS =
            "(function(){" +
            "if(window.__jspdfPatched || !window.jspdf || !window.jspdf.jsPDF)" +
            "  return false;" +
            "window.__jspdfPatched=true;" +
            "console.log('[CHHAPOLA-DIAG] jsPDF monkey-patch APPLIED');" +
            "var Orig=window.jspdf.jsPDF;" +
            "var origSave=Orig.prototype.save;" +
            "Orig.prototype.save=function(n){" +
            "  console.log('[CHHAPOLA-DIAG] doc.save() called with filename='+(n||'document.pdf'));" +
            "  try{" +
            "    var d=this.datauristring();" +
            "    console.log('[CHHAPOLA-DIAG] datauristring() length='+(d?d.length:0));" +
            "    if(d && window.AndroidBridge)" +
            "      window.AndroidBridge.onPdfReady(d, n||'document.pdf');" +
            "    else console.log('[CHHAPOLA-DIAG] Bridge/dataUrl NOT available: d='+(d!=null)+' bridge='+(window.AndroidBridge!=null));" +
            "  }catch(e){console.log('[CHHAPOLA-DIAG] doc.save() bridge call FAILED: '+e);}" +
            "  return origSave.call(this,n);" +
            "};" +
            "return true;" +
            "})()";

        final int[] attempts = {0};
        Runnable poll = new Runnable() {
            @Override
            public void run() {
                WebView wv2 = getWebView();
                if (wv2 == null) return;
                attempts[0]++;
                wv2.evaluateJavascript(PATCH_JS, result -> {
                    // result is "true" if patched, "false" if not yet available
                    Log.i(TAG, "[DIAG-PDF] jsPDF poll attempt=" + attempts[0] + " result=" + result);
                    if (result == null || !result.contains("true")) {
                        if (attempts[0] < 20) {
                            wv2.postDelayed(this, 500);
                        } else {
                            Log.w(TAG, "[DIAG-PDF] jsPDF poll EXHAUSTED after 20 attempts — jsPDF not found");
                        }
                    }
                    // else: patched successfully, stop polling
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
