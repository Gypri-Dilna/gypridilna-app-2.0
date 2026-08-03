package cz.gypridilna.inventarizace.data.network

import cz.gypridilna.inventarizace.BuildConfig
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    // Inject Apps Script URL from BuildConfig (set in local.properties)
    private val BASE_URL: String by lazy {
        val url = BuildConfig.APPS_SCRIPT_URL
        if (url.isNotEmpty() && !url.endsWith("/")) "$url/" else url
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    val apiService: ApiService by lazy {
        // Provide a dummy base URL if the secret is missing to prevent initialization crash
        val finalUrl = if (BASE_URL.isEmpty()) "https://placeholder.com/" else BASE_URL
        
        Retrofit.Builder()
            .baseUrl(finalUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
