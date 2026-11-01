package cz.gypri.dilna;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int RC_SIGN_IN = 9001;
    private static final String DEFAULT_WEB_CLIENT_ID = "1012530250854-aa1at0dleklpc133vd0841l2g9jn9ne6.apps.googleusercontent.com";

    private GoogleSignInClient googleSignInClient;

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

            // 1. Remove '; wv' from User-Agent
            String ua = settings.getUserAgentString();
            if (ua != null && ua.contains("; wv")) {
                settings.setUserAgentString(ua.replace("; wv", ""));
            }

            // 2. Enable settings
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Cookies & Autofill
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
            }

            // 3. Register Native Google Auth Interface into WebView JavaScript
            webView.addJavascriptInterface(new GoogleAuthInterface(), "AndroidGoogleAuth");

            // 4. WebChromeClient: If a web Google button still tries to open a popup window, intercept with native Google Sign-In
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    Log.d(TAG, "onCreateWindow intercepted -> launching native Google Sign-In bottom sheet");
                    startGoogleSignIn(DEFAULT_WEB_CLIENT_ID);
                    return false;
                }
            });
        }
    }

    public class GoogleAuthInterface {
        @JavascriptInterface
        public void signInWithGoogle(String webClientId) {
            runOnUiThread(() -> {
                startGoogleSignIn(webClientId);
            });
        }
    }

    private void startGoogleSignIn(String webClientId) {
        String clientId = (webClientId != null && !webClientId.trim().isEmpty()) ? webClientId.trim() : DEFAULT_WEB_CLIENT_ID;

        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(clientId)
                .requestEmail()
                .build();

            googleSignInClient = GoogleSignIn.getClient(MainActivity.this, gso);

            // Clear previous cache so the native account picker always shows the phone's accounts
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(signInIntent, RC_SIGN_IN);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Google Sign-In", e);
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                if (account != null) {
                    String idToken = account.getIdToken();
                    Log.d(TAG, "Native Google Sign-In SUCCESS for user: " + account.getEmail());
                    if (idToken != null) {
                        deliverGoogleTokenToWebView(idToken);
                    }
                }
            } catch (ApiException e) {
                Log.e(TAG, "Native Google Sign-In failed with status code: " + e.getStatusCode(), e);
                runOnUiThread(() -> {
                    if (bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().evaluateJavascript(
                            "if (window.handleGoogleError) { window.handleGoogleError('Chyba přihlášení Google (kód: " + e.getStatusCode() + ")'); }",
                            null
                        );
                    }
                });
            }
        }
    }

    private void deliverGoogleTokenToWebView(String idToken) {
        runOnUiThread(() -> {
            if (bridge != null && bridge.getWebView() != null) {
                String js = "if (typeof window.handleGoogleCredential === 'function') { " +
                            "    window.handleGoogleCredential('" + idToken + "'); " +
                            "} else if (typeof handleGoogleCredential === 'function') { " +
                            "    handleGoogleCredential('" + idToken + "'); " +
                            "}";
                bridge.getWebView().evaluateJavascript(js, null);
            }
        });
    }
}
