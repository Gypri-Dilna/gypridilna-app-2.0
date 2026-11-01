package cz.gypri.dilna;

import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private Dialog authDialog;

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

            // Enable third-party cookies for OAuth tokens
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

            // 3. Handle popup windows (Google Sign-In popup)
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    if (authDialog != null && authDialog.isShowing()) {
                        authDialog.dismiss();
                    }

                    WebView popupWebView = new WebView(MainActivity.this);
                    WebSettings popupSettings = popupWebView.getSettings();
                    popupSettings.setJavaScriptEnabled(true);
                    popupSettings.setDomStorageEnabled(true);
                    popupSettings.setSupportMultipleWindows(true);
                    popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);

                    // Enable third-party cookies for popup WebView
                    CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                    // Ensure same User-Agent without '; wv'
                    String mainUa = view.getSettings().getUserAgentString();
                    if (mainUa != null) {
                        popupSettings.setUserAgentString(mainUa);
                    }

                    authDialog = new Dialog(MainActivity.this, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);
                    authDialog.setContentView(popupWebView);
                    if (authDialog.getWindow() != null) {
                        authDialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                    }
                    authDialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface d) {
                            popupWebView.destroy();
                        }
                    });
                    authDialog.show();

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            if (authDialog != null && authDialog.isShowing()) {
                                authDialog.dismiss();
                            }
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
                    if (authDialog != null && authDialog.isShowing()) {
                        authDialog.dismiss();
                    }
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (authDialog != null && authDialog.isShowing()) {
            authDialog.dismiss();
            return;
        }
        super.onBackPressed();
    }
}
