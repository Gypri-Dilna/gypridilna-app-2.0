package cz.gypri.dilna;

import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WebView popupWebView = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        setupWebView();
    }

    private void setupWebView() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // 1. Remove '; wv' from User-Agent so Google allows OAuth inside WebView
            String ua = settings.getUserAgentString();
            if (ua != null && ua.contains("; wv")) {
                settings.setUserAgentString(ua.replace("; wv", ""));
            }

            // 2. Enable multiple windows support for Google OAuth popup
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Enable third-party cookies and Autofill for OAuth tokens
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
            }

            // 3. Handle popup windows (Google Sign-In popup) directly as an overlay view
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    closePopup();

                    popupWebView = new WebView(MainActivity.this);
                    WebSettings popupSettings = popupWebView.getSettings();
                    popupSettings.setJavaScriptEnabled(true);
                    popupSettings.setDomStorageEnabled(true);
                    popupSettings.setDatabaseEnabled(true);
                    popupSettings.setSupportMultipleWindows(true);
                    popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);

                    // Enable third-party cookies and autofill for popup WebView
                    CookieManager.getInstance().setAcceptCookie(true);
                    CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        popupWebView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
                    }

                    // Ensure same clean User-Agent without '; wv'
                    String mainUa = view.getSettings().getUserAgentString();
                    if (mainUa != null) {
                        popupSettings.setUserAgentString(mainUa);
                    }

                    // Add popup directly as full-screen overlay to root view (guarantees native keyboard & autofill)
                    ViewGroup root = findViewById(android.R.id.content);
                    if (root != null) {
                        root.addView(popupWebView, new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
                        ));
                    }
                    popupWebView.requestFocus();

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            closePopup();
                        }
                    });

                    popupWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            // Keep all OAuth navigations inside the popup WebView
                            return false;
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(popupWebView);
                    resultMsg.sendToTarget();
                    return true;
                }

                @Override
                public void onCloseWindow(WebView window) {
                    closePopup();
                }
            });
        }
    }

    private void closePopup() {
        if (popupWebView != null) {
            ViewGroup root = findViewById(android.R.id.content);
            if (root != null) {
                root.removeView(popupWebView);
            }
            popupWebView.destroy();
            popupWebView = null;
            CookieManager.getInstance().flush();
        }
    }

    @Override
    public void onBackPressed() {
        if (popupWebView != null) {
            if (popupWebView.canGoBack()) {
                popupWebView.goBack();
            } else {
                closePopup();
            }
            return;
        }
        super.onBackPressed();
    }
}
