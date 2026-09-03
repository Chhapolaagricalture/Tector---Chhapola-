package com.chhapola.agriculture;

import android.os.Bundle;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * Chhapola Android App — MainActivity
 *
 * WebView viewport:
 *   setUseWideViewPort(true) makes the WebView respect the website's
 *   <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *   just like Chrome mobile does. Without this, Android WebView ignores
 *   the viewport tag and renders at ~980px CSS width (desktop mode),
 *   causing horizontal overflow on mobile screens.
 *
 * Back button = browser-back:
 *   1. WebView history exists → goBack() (previous website page)
 *   2. Modal/menu/drawer open  → closed by website's own JS via popstate
 *   3. No history left         → Toast hint, stay in app (prevent accidental exit)
 *   4. Second Back within 2.5s → finish() (normal exit)
 */
public class MainActivity extends BridgeActivity {

    private long lastBackTime = 0;

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
        // Re-apply in onResume to survive any WebView recreation
        // or Capacitor internal re-initialization.
        configureWebView();
    }

    /**
     * Apply WebView viewport settings.
     * Called in both onCreate and onResume for reliability.
     */
    private void configureWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setUseWideViewPort(true);
        }
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
