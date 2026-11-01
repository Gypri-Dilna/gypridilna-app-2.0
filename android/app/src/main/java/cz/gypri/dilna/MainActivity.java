package cz.gypri.dilna;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
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

            // 4. WebChromeClient: If a web Google button opens popup, launch native Google Sign-In
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
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

            // Clear previous session cache so account picker always appears
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(signInIntent, RC_SIGN_IN);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Google Sign-In", e);
            Toast.makeText(MainActivity.this, "Chyba inicializace Google Sign-In: " + e.getMessage(), Toast.LENGTH_LONG).show();
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
                    String email = account.getEmail();
                    Log.d(TAG, "Native Google Sign-In SUCCESS for user: " + email);
                    if (idToken != null && !idToken.isEmpty()) {
                        deliverGoogleTokenToWebView(idToken, email);
                    } else {
                        Toast.makeText(this, "Google nevrátil ID token pro účet " + email, Toast.LENGTH_LONG).show();
                    }
                }
            } catch (ApiException e) {
                int code = e.getStatusCode();
                Log.e(TAG, "Native Google Sign-In failed with status code: " + code, e);
                if (code == 12501 || code == 12502) {
                    // User simply dismissed or canceled the account picker dialog
                    return;
                }
                String msg = "Chyba přihlášení Google (kód: " + code + ")";
                if (code == 10) {
                    msg = "Chyba konfigurace Google (kód 10): Zkontrolujte SHA-1 otisk certifikátu v Google Cloud Console.";
                } else if (code == 12500) {
                    msg = "Chyba Google Play Services (kód 12500). Zkuste to znovu.";
                }
                final String finalMsg = msg;
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, finalMsg, Toast.LENGTH_LONG).show();
                    if (bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().evaluateJavascript(
                            "if (window.handleGoogleError) { window.handleGoogleError('" + finalMsg.replace("'", "\\'") + "'); }",
                            null
                        );
                    }
                });
            }
        }
    }

    private void deliverGoogleTokenToWebView(String idToken, String email) {
        runOnUiThread(() -> {
            if (bridge != null && bridge.getWebView() != null) {
                // Execute self-contained asynchronous login flow directly inside the WebView
                String script = "(async function() {" +
                    "  const token = '" + idToken + "';" +
                    "  if (typeof window.handleGoogleCredential === 'function') {" +
                    "    window.handleGoogleCredential(token);" +
                    "    return;" +
                    "  }" +
                    "  try {" +
                    "    const res = await fetch('/api/google-login', {" +
                    "      method: 'POST'," +
                    "      headers: { 'Content-Type': 'application/json' }," +
                    "      body: JSON.stringify({ credential: token })" +
                    "    });" +
                    "    const data = await res.json();" +
                    "    if (res.ok && data.status === 'success' && data.token) {" +
                    "      localStorage.setItem('gypri_auth_token', data.token);" +
                    "      if (data.user) {" +
                    "        localStorage.setItem('savedUser', JSON.stringify(data.user));" +
                    "      }" +
                    "      window.location.reload();" +
                    "    } else {" +
                    "      alert(data.detail || data.message || 'E-mail není autorizován pro žádného uživatele systému.');" +
                    "    }" +
                    "  } catch(err) {" +
                    "    alert('Chyba komunikace se serverem: ' + err);" +
                    "  }" +
                    "})();";
                bridge.getWebView().evaluateJavascript(script, null);
            }
        });
    }
}
