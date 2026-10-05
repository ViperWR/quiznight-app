package io.github.viperwr.quiznight

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.mediarouter.app.MediaRouteChooserDialog
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.SessionManagerListener
import org.json.JSONObject

/**
 * Hosts the Quiz Night web app and gives it real Chromecast casting through the
 * native Cast SDK. The page talks to [CastBridge] as `window.QuizNightCast`, and
 * this activity reports session changes back through `window.__quizCastState`.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var castContext: CastContext

    private val sessionListener = object : SessionManagerListener<CastSession> {
        override fun onSessionStarting(session: CastSession) = report("connecting")
        override fun onSessionStarted(session: CastSession, sessionId: String) = report("connected")
        override fun onSessionStartFailed(session: CastSession, error: Int) = report("idle", "start_failed_$error")
        override fun onSessionResuming(session: CastSession, sessionId: String) = report("connecting")
        override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) = report("connected")
        override fun onSessionResumeFailed(session: CastSession, error: Int) = report("idle")
        override fun onSessionSuspended(session: CastSession, reason: Int) = report("idle")
        override fun onSessionEnding(session: CastSession) = Unit
        override fun onSessionEnded(session: CastSession, error: Int) = report("idle")
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        @Suppress("DEPRECATION")
        castContext = CastContext.getSharedInstance(this)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    // Tell a freshly loaded page about a session that is already running
                    if (castContext.sessionManager.currentCastSession?.isConnected == true) report("connected")
                }
            }
            addJavascriptInterface(CastBridge(), "QuizNightCast")
        }
        setContentView(webView)
        castContext.sessionManager.addSessionManagerListener(sessionListener, CastSession::class.java)
        if (savedInstanceState == null) webView.loadUrl(APP_URL) else webView.restoreState(savedInstanceState)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        castContext.sessionManager.removeSessionManagerListener(sessionListener, CastSession::class.java)
        super.onDestroy()
    }

    private fun report(state: String, error: String? = null) {
        val err = if (error == null) "null" else JSONObject.quote(error)
        runOnUiThread {
            webView.evaluateJavascript("window.__quizCastState && window.__quizCastState('$state', $err)", null)
        }
    }

    private inner class CastBridge {
        /** Opens the Cast device picker; the SDK starts the session when a TV is chosen. */
        @JavascriptInterface
        fun start() = runOnUiThread {
            if (castContext.sessionManager.currentCastSession?.isConnected == true) {
                report("connected")
            } else {
                val selector = castContext.mergedSelector ?: return@runOnUiThread
                MediaRouteChooserDialog(this@MainActivity).apply { routeSelector = selector }.show()
            }
        }

        @JavascriptInterface
        fun send(json: String) = runOnUiThread {
            castContext.sessionManager.currentCastSession?.sendMessage(NAMESPACE, json)
        }

        @JavascriptInterface
        fun stop() = runOnUiThread {
            castContext.sessionManager.endCurrentSession(true)
        }
    }

    companion object {
        const val APP_URL = "https://viperwr.github.io/quiznight-app/"
        const val NAMESPACE = "urn:x-cast:com.viperwr.quiznight"
    }
}
