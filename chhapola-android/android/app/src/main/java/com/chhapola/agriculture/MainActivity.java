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
import android.os.Environment;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
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

/**
 * Chhapola Agriculture — Professional Android App
 *
 * Features:
 *   - Desktop/Mobile Site toggle (Chrome Desktop site ON/OFF)
 *   - Pull-to-Refresh (SwipeRefreshLayout)
 *   - Three-Dot Professional Menu
 *   - File Upload / Camera / Gallery
 *   - Download handling
 *   - External links (Phone, Email, WhatsApp, Maps)
 *   - Loading indicator + Error page with retry
 *   - Network monitoring (offline → online auto-retry)
 *   - Login/Session preservation (Firebase via WebView)
 *   - Back button = browser-back with double-press exit
 */
public class MainActivity extends BridgeActivity {

    /* ── State ────────────────────────────────────────────────── */
    private long lastBackTime = 0;
    private boolean desktopMode = true;
    private boolean isNetworkAvailable = true;

    /* ── UI references (created programmatically) ─────────────── */
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout errorPage;
    private Toolbar toolbar;
    private MenuItem desktopToggle;

    /* ── File upload ──────────────────────────────────────────── */
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 2001;

    /* ── User-Agents ──────────────────────────────────────────── */
    private static final String DESKTOP_UA =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private static final String MOBILE_UA =
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

    /* ══════════════════════════════════════════════════════════════
       LIFECYCLE
       ══════════════════════════════════════════════════════════════ */

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (savedInstanceState != null) {
            desktopMode = savedInstanceState.getBoolean("desktopMode", true);
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
       VIEW SETUP — Toolbar + ProgressBar + SwipeRefresh + ErrorPage
       ══════════════════════════════════════════════════════════════ */

    private void setupCustomViews() {
        WebView webView = getWebView();
        if (webView == null) return;
        if (swipeRefresh != null) return; // already set up

        // Remove WebView from current parent
        if (webView.getParent() != null) {
            ((android.view.ViewGroup) webView.getParent()).removeView(webView);
        }

        // Root container
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        // SwipeRefreshLayout (wraps WebView)
        swipeRefresh = new SwipeRefreshLayout(this);
        swipeRefresh.setColorSchemeColors(
                ContextCompat.getColor(this, R.color.colorPrimary));
        swipeRefresh.setOnRefreshListener(() -> {
            WebView wv = getWebView();
            if (wv != null) wv.reload();
        });

        // Add WebView to SwipeRefresh
        swipeRefresh.addView(webView,
                new FrameLayout.LayoutParams(
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
                FrameLayout.LayoutParams.MATCH_PARENT,
                dpToPx(56));
        toolbarParams.gravity = android.view.Gravity.TOP;
        root.addView(toolbar, toolbarParams);

        // Push WebView below toolbar
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
        setupWebViewClients();
        registerNetworkCallback();
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
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dpToPx(16);
        layout.addView(title, titleParams);

        TextView subtitle = new TextView(this);
        subtitle.setText("कृपया अपना internet connection जाँचें\nऔर फिर से try करें।");
        subtitle.setTextSize(14);
        subtitle.setTextColor(Color.parseColor("#666666"));
        subtitle.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        subParams.topMargin = dpToPx(8);
        layout.addView(subtitle, subParams);

        TextView retryBtn = new TextView(this);
        retryBtn.setText("🔄  Retry");
        retryBtn.setTextSize(16);
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setBackgroundColor(ContextCompat.getColor(this, R.color.colorPrimary));
        retryBtn.setPadding(dpToPx(32), dpToPx(12), dpToPx(32), dpToPx(12));
        retryBtn.setGravity(android.view.Gravity.CENTER);
        retryBtn.setOnClickListener(v -> {
            WebView wv = getWebView();
            if (wv != null && isNetworkAvailable) wv.reload();
        });
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        retryParams.topMargin = dpToPx(24);
        layout.addView(retryBtn, retryParams);

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

        // Core
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);

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

        // Cookies (essential for Firebase/auth sessions)
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
    }

    /* ══════════════════════════════════════════════════════════════
       WEBVIEW CLIENTS
       ══════════════════════════════════════════════════════════════ */

    private void setupWebViewClients() {
        WebView webView = getWebView();
        if (webView == null) return;

        webView.setWebViewClient(new ChhapolaWebViewClient());
        webView.setWebChromeClient(new ChhapolaChromeClient());

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

    /* ── WebViewClient ──────────────────────────────────────── */

    private class ChhapolaWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView wv, WebResourceRequest req) {
            String url = req.getUrl().toString();

            // Phone
            if (url.startsWith("tel:")) {
                startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse(url)));
                return true;
            }
            // Email
            if (url.startsWith("mailto:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)));
                return true;
            }
            // SMS
            if (url.startsWith("sms:")) {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)));
                return true;
            }
            // WhatsApp
            if (url.contains("api.whatsapp.com") || url.contains("wa.me/")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception e) {
                    startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse("https://wa.me/" + url.substring(url.lastIndexOf("/") + 1))));
                }
                return true;
            }
            // Google Maps
            if (url.startsWith("geo:") || url.contains("maps.google")) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
            // Play Store
            if (url.contains("play.google.com")) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
            // Other external: YouTube, social media, etc.
            if (!url.contains("chhapolaagriculture.com")
                    && !url.startsWith("about:blank")
                    && req.isForMainFrame()) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception e) {
                    // ignore
                }
                return true;
            }

            return false; // let WebView load it
        }

        @Override
        public void onPageStarted(WebView wv, String url, Bitmap favicon) {
            super.onPageStarted(wv, url, favicon);
            if (progressBar != null) {
                progressBar.setVisibility(View.VISIBLE);
            }
            if (errorPage != null) {
                errorPage.setVisibility(View.GONE);
            }
        }

        @Override
        public void onPageFinished(WebView wv, String url) {
            super.onPageFinished(wv, url);
            if (progressBar != null) {
                progressBar.setVisibility(View.GONE);
            }
            if (swipeRefresh != null) {
                swipeRefresh.setRefreshing(false);
            }
        }

        @Override
        public void onReceivedError(WebView wv, WebResourceRequest req,
                                    WebResourceError error) {
            super.onReceivedError(wv, req, error);
            // Only show error page for main frame
            if (req.isForMainFrame()) {
                if (progressBar != null) progressBar.setVisibility(View.GONE);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (errorPage != null) errorPage.setVisibility(View.VISIBLE);
            }
        }
    }

    /* ── WebChromeClient ────────────────────────────────────── */

    private class ChhapolaChromeClient extends WebChromeClient {

        // File upload
        @Override
        public boolean onShowFileChooser(WebView wv,
                                         ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
            }
            fileUploadCallback = callback;

            // Camera permission
            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.CAMERA}, PERMISSION_REQUEST);
                return true;
            }

            launchFileChooser();
            return true;
        }

        // Page loading progress
        @Override
        public void onProgressChanged(WebView wv, int newProgress) {
            if (progressBar != null) {
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }
        }

        // Geolocation (for maps on website)
        @Override
        public void onGeolocationPermissionsShowPrompt(String origin,
                GeolocationPermissions.Callback callback) {
            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.ACCESS_FINE_LOCATION)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, PERMISSION_REQUEST);
            }
            callback.invoke(origin, true, false);
        }
    }

    /* ══════════════════════════════════════════════════════════════
       FILE UPLOAD
       ══════════════════════════════════════════════════════════════ */

    private void launchFileChooser() {
        Intent cameraIntent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

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

        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (fileUploadCallback != null) {
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
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST) {
            // Permission granted — retry file chooser
            if (grantResults.length > 0
                    && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                launchFileChooser();
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       PERMISSIONS
       ══════════════════════════════════════════════════════════════ */

    private void requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
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
            case 1: // Refresh
                webView.reload();
                return true;

            case 2: // Back
                if (webView.canGoBack()) webView.goBack();
                return true;

            case 3: // Forward
                if (webView.canGoForward()) webView.goForward();
                return true;

            case 4: // Desktop Site toggle
                desktopMode = !desktopMode;
                if (desktopToggle != null) {
                    desktopToggle.setTitle(desktopMode
                            ? "🖥️  Desktop Site: ON"
                            : "📱  Desktop Site: OFF");
                }
                configureWebView();
                webView.reload();
                Toast.makeText(this,
                        desktopMode ? "Desktop Site ON" : "Mobile Site ON",
                        Toast.LENGTH_SHORT).show();
                return true;

            case 5: // Share
                shareCurrentPage();
                return true;

            case 6: // Find in Page
                showFindInPage();
                return true;

            case 7: // About
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

        // Hide find-in-page if active
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

        // Initial state
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
            // Auto-retry if error page was showing
            if (webView.getVisibility() == View.VISIBLE
                    && errorPage != null && errorPage.getVisibility() == View.VISIBLE) {
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

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }
}
