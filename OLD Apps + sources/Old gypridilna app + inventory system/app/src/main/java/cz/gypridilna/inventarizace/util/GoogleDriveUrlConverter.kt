package cz.gypridilna.inventarizace.util

fun convertGoogleDriveUrl(url: String): String? {
    val regex = "https://drive.google.com/file/d/([^/]+)/.*".toRegex()
    val matchResult = regex.find(url)
    return matchResult?.groupValues?.get(1)?.let {
        "https://drive.google.com/uc?export=view&id=$it"
    }
}
