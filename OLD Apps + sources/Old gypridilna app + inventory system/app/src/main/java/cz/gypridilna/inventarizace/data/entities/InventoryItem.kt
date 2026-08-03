package cz.gypridilna.inventarizace.data.entities

import com.google.gson.annotations.SerializedName

data class InventoryItem(
    @SerializedName("NÁZEV") val name: String?,
    @SerializedName("RACK") val rack: String?,
    @SerializedName("POZICE") val position: String?,
    @SerializedName("BOX") val box: String?,
    @SerializedName("NUMBER") val number: String?,
    @SerializedName("ID") val id: String?,
    @SerializedName("BARCODE") val barcode: String?,
    @SerializedName("OBRÁZEK") val imageUrl: String?
)
