package com.chhapola.agriculture;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * Chhapola Android App — MainActivity
 *
 * Desktop Site Mode:
 *   WebView uses a desktop Chrome User-Agent so the website serves its
 *   desktop layout (same as Chrome "Desktop site ON"). The viewport is
 *   configured with useWideViewPort(true) + loadWithOverviewMode(false)
 *   so the full desktop-width page renders and the user can zoom/scroll.
 *
 * Back button = browser-back:
 *   1. WebView history exists → goBack() (previous website page)
 *   2. Modal/menu/drawer open  → closed by website's own JS via popstate
 *   3. No history left         → Toast hint, stay in app (prevent accidental exit)
 *   4. Second Back within 2.5s → finish() (normal exit)
 */
public class MainActivity extends BridgeActivity {

    private long lastBackTime = 0;

    /** Desktop Chrome User-Agent — same as Chrome Desktop site ON */
    private static final String DESKTOP_USER_AGENT =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWebView();

        // Modern back-button handling (OnBackPressedCallback for API 34+)
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleBackNavigation();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebView();
    }

    /**
     * Configure WebView for Desktop Site mode.
     * Called in both onCreate and onResume for reliability.
     */
    private void configureWebView() {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        WebSettings settings = getBridge().getWebView().getSettings();

        // Desktop User-Agent: makes the website serve its desktop layout
        settings.setUserAgentString(DESKTOP_USER_AGENT);

        // Viewport: respect meta viewport + don't zoom-to-fit
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);

        // Zoom: allow pinch-zoom and double-tap zoom (hide UI buttons for cleaner look)
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Text zoom at 100%
        settings.setTextZoom(100);
    }

    /**
     * Back navigation logic:
     *   - WebView can go back → goBack()
     *   - No history → Toast hint (first press), then finish() (second press within 2.5s)
     *   - No System.exit(0) anywhere
     */
    private void handleBackNavigation() {
        if (getBridge() != null && getBridge().getWebView() != null
                && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
        } else {
            long now = System.currentTimeMillis();
            if (now - lastBackTime < 2500) {
                finish();
            } else {
                lastBackTime = now;
                Toast.makeText(this, "Back दबाकर app बंद करें", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
