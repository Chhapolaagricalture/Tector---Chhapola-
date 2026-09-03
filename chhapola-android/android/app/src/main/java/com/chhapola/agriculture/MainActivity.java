package com.chhapola.agriculture;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private long lastBackPressTime = 0;
    private Toast backToast;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // --- Screen Responsiveness Fix ---
        final WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings ws = webView.getSettings();

            // Prevent desktop-like zoom scaling
            ws.setUseWideViewPort(true);
            ws.setLoadWithOverviewMode(true);

            // Remove zoom controls (user pinch-zooms naturally)
            ws.setBuiltInZoomControls(false);
            ws.setDisplayZoomControls(false);

            // Force viewport scale to fit device width
            webView.setInitialScale(1);

            // Smooth scrolling
            webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

            // Inject JS to fix any viewport/rendering issues
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    // Ensure full-width rendering
                    view.evaluateJavascript(
                        "(function(){" +
                        "  var vp=document.querySelector('meta[name=viewport]');" +
                        "  if(vp){vp.setAttribute('content','width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=yes');}" +
                        "  document.body.style.overflowX='hidden';" +
                        "  document.body.style.maxWidth='100vw';" +
                        "  document.body.style.width='100%';" +
                        "  var html=document.documentElement;" +
                        "  html.style.overflowX='hidden';" +
                        "  html.style.maxWidth='100vw';" +
                        "  html.style.width='100%';" +
                        "  return 'ok';" +
                        "})();", null);
                }
            });

            webView.setWebChromeClient(new WebChromeClient());
        }

        // --- Edge-to-edge: ensure content renders below status bar properly ---
        Window window = getWindow();
        if (window != null) {
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            final WebView webView = getBridge().getWebView();
            if (webView == null) return super.onKeyDown(keyCode, event);

            // Case C: Try to close any open modal/dialog/drawer via JS
            final boolean[] closedSomething = {false};
            webView.evaluateJavascript(
                "(function(){" +
                "  var closed=false;" +
                "  // Close side menu if open" +
                "  var sideMenu=document.querySelector('.side-menu-overlay.active,.side-menu.open,.side-menu.show');" +
                "  if(sideMenu&&typeof closeSideMenu==='function'){closeSideMenu();closed=true;}" +
                "  // Close user settings panel if open" +
                "  var settings=document.getElementById('userSettingsPanel');" +
                "  if(settings&&settings.style.display!=='none'&&settings.style.display!==''){if(typeof handleSettingsBack==='function'){handleSettingsBack();closed=true;}}" +
                "  // Close any visible modal overlay" +
                "  var modals=document.querySelectorAll('.modal-overlay,.modal.show,.modal.open,[style*=\"display: block\"]');" +
                "  modals.forEach(function(m){" +
                "    if(m.style&&m.style.display&&m.style.display!=='none'){" +
                "      m.style.display='none';closed=true;" +
                "    }" +
                "  });" +
                "  return closed?'closed':'none';" +
                "})();",
                value -> {
                    if (value != null && value.contains("closed")) {
                        closedSomething[0] = true;
                    }
                }
            );

            // If a modal was closed, consume the event
            if (closedSomething[0]) return true;

            // Case A: WebView has history -> go back in website
            if (webView.canGoBack()) {
                webView.goBack();
                return true;
            }

            // Case B: No history -> double-press to exit (prevent accidental exit)
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastBackPressTime < 2000) {
                if (backToast != null) backToast.cancel();
                finishAffinity();
                System.exit(0);
            } else {
                lastBackPressTime = currentTime;
                backToast = Toast.makeText(this, "Back दबाकर app बंद करें", Toast.LENGTH_SHORT);
                backToast.show();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
