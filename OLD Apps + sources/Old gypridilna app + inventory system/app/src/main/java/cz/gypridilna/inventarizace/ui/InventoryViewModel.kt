package cz.gypridilna.inventarizace.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cz.gypridilna.inventarizace.data.InventoryRepository
import cz.gypridilna.inventarizace.data.entities.InventoryItem
import cz.gypridilna.inventarizace.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.Normalizer

class InventoryViewModel : ViewModel() {

    private val repository = InventoryRepository(RetrofitClient.apiService)

    private val _inventoryItems = MutableStateFlow<List<InventoryItem>>(emptyList())
    val inventoryItems: StateFlow<List<InventoryItem>> = _inventoryItems

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    val searchedItems: StateFlow<List<InventoryItem>> = _searchQuery
        .combine(_inventoryItems) { query, items ->
            if (query.isBlank()) {
                items
            } else {
                val normalizedQuery = query.removeCzechDiacritics().lowercase()
                items.filter { it.matches(normalizedQuery) }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    init {
        refreshInventory()
    }

    fun refreshInventory() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _inventoryItems.value = repository.getInventory()
            } catch (e: Exception) {
                // Potential error logging here
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun findItemByBarcode(barcode: String): InventoryItem? {
        return _inventoryItems.value.find { it.id?.endsWith(barcode) == true }
    }

    private fun InventoryItem.matches(query: String): Boolean {
        val normalizedName = name?.removeCzechDiacritics()?.lowercase() ?: ""
        val normalizedId = id?.lowercase() ?: ""
        val normalizedBarcode = barcode?.lowercase() ?: ""
        val normalizedRack = rack?.lowercase() ?: ""
        val normalizedPosition = position?.lowercase() ?: ""

        return normalizedName.contains(query) ||
                normalizedId.contains(query) ||
                normalizedBarcode.contains(query) ||
                normalizedRack.contains(query) ||
                normalizedPosition.contains(query) ||
                normalizedId.endsWith(query)
    }

    private fun String.removeCzechDiacritics(): String {
        return Normalizer.normalize(this, Normalizer.Form.NFD)
            .replace("\\p{InCombiningDiacriticalMarks}".toRegex(), "")
            .replace("ł", "l")
            .replace("Ł", "L")
    }
}
