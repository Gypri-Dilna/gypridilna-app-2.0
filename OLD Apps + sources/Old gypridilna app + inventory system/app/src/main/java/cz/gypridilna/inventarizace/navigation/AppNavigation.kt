package cz.gypridilna.inventarizace.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import cz.gypridilna.inventarizace.ui.screens.AccessSystemScreen
import cz.gypridilna.inventarizace.ui.screens.AddItemScreen
import cz.gypridilna.inventarizace.ui.screens.ConnectScreen
import cz.gypridilna.inventarizace.ui.screens.ProfileScreen
import cz.gypridilna.inventarizace.ui.screens.ScannerScreen
import cz.gypridilna.inventarizace.ui.screens.SearchScreen

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val mainItems = listOf(
        Screen.GypriDilna,
        Screen.AccessSystem,
        Screen.Connect,
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                mainItems.forEach { screen ->
                    val isSelected = currentDestination?.hierarchy?.any { 
                        it.route == screen.route || (screen == Screen.GypriDilna && it.route in listOf(Screen.Scanner.route, Screen.AddItem.route, Screen.Search.route))
                    } == true
                    
                    NavigationBarItem(
                        icon = { Icon(screen.icon!!, contentDescription = null) },
                        label = { Text(screen.title) },
                        selected = isSelected,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController,
            startDestination = Screen.GypriDilna.route,
            Modifier.padding(innerPadding)
        ) {
            composable(Screen.GypriDilna.route) { GypriDilnaRoot(navController) }
            composable(Screen.AccessSystem.route) { AccessSystemScreen() }
            composable(Screen.Connect.route) { ConnectScreen() }
            
            composable(
                route = Screen.Profile.route,
                arguments = listOf(navArgument("itemId") { type = NavType.StringType })
            ) { backStackEntry ->
                ProfileScreen(itemId = backStackEntry.arguments?.getString("itemId"))
            }
        }
    }
}

@Composable
fun GypriDilnaRoot(navController: androidx.navigation.NavController) {
    val tabs = listOf(Screen.Scanner, Screen.AddItem, Screen.Search)
    var selectedTabIndex by remember { mutableIntStateOf(2) } // Default to Search

    Column {
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            indicator = { tabPositions ->
                if (selectedTabIndex < tabPositions.size) {
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        ) {
            tabs.forEachIndexed { index, screen ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = { Text(screen.title) },
                    selectedContentColor = MaterialTheme.colorScheme.primary,
                    unselectedContentColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
        
        when (selectedTabIndex) {
            0 -> ScannerScreen(navController = navController)
            1 -> AddItemScreen()
            2 -> SearchScreen(navController = navController)
        }
    }
}
