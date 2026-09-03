package com.chhapola.agriculture;

import android.os.Bundle;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

/**
 * Back button = browser-back.
 * - WebView history → goBack()
 * - No history → toast, stay in app (prevent accidental exit)
 * - Modal/drawer closing handled by website's own JS via popstate event
 */
public class MainActivity extends BridgeActivity {

    private long lastBackTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // No custom WebView settings — website's own viewport handles layout
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null
                && getBridge().getWebView().canGoBack()) {
            // Case 1 & 2: WebView has history → go back in website
            // (website's own JS handles modal close via popstate if needed)
            getBridge().getWebView().goBack();
        } else {
            // Case 3: No history → prevent accidental exit
            long now = System.currentTimeMillis();
            if (now - lastBackTime < 2500) {
                // Second press within 2.5s → exit
                super.onBackPressed();
            } else {
                lastBackTime = now;
                Toast.makeText(this, "Back दबाकर app बंद करें", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
