package cz.gypridilna.inventarizace.data.network

import cz.gypridilna.inventarizace.data.entities.InventoryItem
import retrofit2.http.GET

interface ApiService {
    @GET("exec")
    suspend fun getInventory(): List<InventoryItem>
}
