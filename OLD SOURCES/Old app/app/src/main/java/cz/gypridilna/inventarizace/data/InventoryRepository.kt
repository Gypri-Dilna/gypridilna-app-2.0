package cz.gypridilna.inventarizace.data

import cz.gypridilna.inventarizace.data.network.ApiService

class InventoryRepository(private val apiService: ApiService) {
    suspend fun getInventory() = apiService.getInventory()
}
