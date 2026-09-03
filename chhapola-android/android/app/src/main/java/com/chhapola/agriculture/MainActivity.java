package com.chhapola.agriculture;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * Minimal MainActivity — lets the website render exactly like a mobile browser.
 * Back button navigates WebView history (like a browser back button).
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // No custom WebView settings — Capacitor defaults + the website's own
        // viewport meta tag handle responsive layout correctly.
    }

    /**
     * Back button = browser back.
     * - If WebView has history → goBack()
     * - If no history → call default behavior (Activity finishes naturally)
     *
     * Modal/drawer closing is handled by the website's own JavaScript
     * via the standard 'popstate' / 'keydown' event listeners,
     * exactly as it works in Chrome mobile.
     */
    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // No WebView history left — let the system handle it
            // (Activity finishes, user returns to launcher)
            super.onBackPressed();
        }
    }
}
