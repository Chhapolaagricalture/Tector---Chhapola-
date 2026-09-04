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
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.JsResult;
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

/**
 * Chhapola Agriculture — Professional Android App
 *
 * Features:
 *   - Desktop/Mobile Site toggle
 *   - Pull-to-Refresh
 *   - Three-Dot Professional Menu
 *   - File Upload / Camera / Gallery
 *   - Download handling
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
        // Ensure our WebChromeClient is active after Capacitor lifecycle.
        // Do NOT create new BridgeWebChromeClient here — its constructor
        // calls bridge.registerForActivityResult() which crashes if
        // called after onStart(). Instead, re-apply the existing clients.
        reapplyWebViewClients();
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
        if (webView == null) return;

        // Create clients once and save references.
        // BridgeWebChromeClient constructor calls registerForActivityResult()
        // which can only be invoked before onStart() — never recreate these
        // after the activity is running.
        if (webViewClient == null) {
            webViewClient = new ChhapolaWebViewClient();
        }
        if (chromeClient == null) {
            chromeClient = new ChhapolaChromeClient(getBridge());
        }

        webView.setWebViewClient(webViewClient);
        webView.setWebChromeClient(chromeClient);

        webView.setDownloadListener((url, userAgent, contentDisposition,
                                     mimetype, contentLength) -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                Toast.makeText(this, "Download started…", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Cannot open download link",
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Re-apply saved clients to the WebView without creating new ones.
     * Safe to call from onResume() because it never instantiates a new
     * BridgeWebChromeClient (whose constructor requires pre-STARTED state).
     */
    private void reapplyWebViewClients() {
        WebView webView = getWebView();
        if (webView == null || webViewClient == null || chromeClient == null) return;
        webView.setWebViewClient(webViewClient);
        webView.setWebChromeClient(chromeClient);
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
        }

        @Override
        public void onPageFinished(WebView wv, String url) {
            super.onPageFinished(wv, url);
            if (progressBar != null) progressBar.setVisibility(View.GONE);
            if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            // Desktop mode: inject viewport override after page fully loaded
            // Delay 1500ms to let website JS initialize completely first
            if (desktopMode) {
                wv.postDelayed(() -> applyDesktopViewport(wv), 1500);
            }
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
     * Extends Capacitor's BridgeWebChromeClient so our onJsAlert
     * override takes precedence over Capacitor's default dialog.
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

        // Custom AlertDialog for JS alerts.
        // Uses a consumed-flag to prevent double-calling result.confirm()/cancel()
        // which causes IllegalStateException and freezes JS execution.
        @Override
        public boolean onJsAlert(WebView wv, String url, String message,
                                 JsResult result) {
            if (isFinishing()) { result.cancel(); return true; }
            final boolean[] consumed = {false};
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle(extractHost(url))
                    .setMessage(sanitizeAlertMessage(message))
                    .setCancelable(false)
                    .setPositiveButton("OK", (dialog, which) -> {
                        if (!consumed[0]) {
                            consumed[0] = true;
                            result.confirm();
                        }
                    })
                    .setOnDismissListener(dialog -> {
                        if (!consumed[0]) {
                            consumed[0] = true;
                            result.confirm();
                        }
                    })
                    .show();
            return true;
        }

        @Override
        public boolean onJsConfirm(WebView wv, String url, String message,
                                   JsResult result) {
            if (isFinishing()) { result.cancel(); return true; }
            final boolean[] consumed = {false};
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle(extractHost(url))
                    .setMessage(sanitizeAlertMessage(message))
                    .setCancelable(false)
                    .setPositiveButton("OK", (dialog, which) -> {
                        if (!consumed[0]) {
                            consumed[0] = true;
                            result.confirm();
                        }
                    })
                    .setNegativeButton("Cancel", (dialog, which) -> {
                        if (!consumed[0]) {
                            consumed[0] = true;
                            result.cancel();
                        }
                    })
                    .setOnDismissListener(dialog -> {
                        if (!consumed[0]) {
                            consumed[0] = true;
                            result.cancel();
                        }
                    })
                    .show();
            return true;
        }



        @Override
        public boolean onConsoleMessage(ConsoleMessage cm) {
            // Log console messages for debugging
            return true;
        }
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
       HELPERS
       ══════════════════════════════════════════════════════════════ */

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
            String js = "(function(){" +
                    "try{" +
                    "var vp=document.querySelector('meta[name=viewport]');" +
                    "if(vp){vp.setAttribute('content','width=1200');}" +
                    "else{var m=document.createElement('meta');" +
                    "m.name='viewport';m.content='width=1200';" +
                    "document.head.appendChild(m);}" +
                    "}catch(e){}" +
                    "})();";
            wv.evaluateJavascript(js, null);
        } catch (Exception e) {
            // Silently ignore — don't break the page
        }
    }

    /* ══════════════════════════════════════════════════════════════
       HELPERS
       ══════════════════════════════════════════════════════════════ */

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

    /**
     * Sanitize JS alert message for clean display in AlertDialog.
     * Strips HTML tags (images, scripts, etc.) that don't render
     * in native TextView and show as broken icons.
     */
    private String sanitizeAlertMessage(String message) {
        if (message == null || message.isEmpty()) return "";
        // Strip all HTML tags — images, scripts, etc.
        // that cause broken-image icons in native dialogs
        return message.replaceAll("<[^>]*>", "").trim();
    }
}
