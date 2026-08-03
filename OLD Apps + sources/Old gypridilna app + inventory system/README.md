# Gypri Dílna

A multifunctional Android application designed for the Gypri Dílna technical workshop to manage inventory and workshop access.

## Features

*   **Barcode Scanner:** Instant inventory checking using the device camera. Automatically navigates to item details upon a valid scan.
*   **Item Search:** Quick lookup by name, rack, or position with a shimmering skeleton loading animation.
*   **Item Detail Screen:** Comprehensive view of item properties, including local placement images and a dynamic, animated workshop minimap.
*   **Access System:** Integrated WebView for the workshop's RFID access control dashboard.
*   **Add New Items:** Direct integration with Google Forms for seamless data entry.
*   **Custom Dark Theme:** A consistent dark-themed UI following workshop brand guidelines (Circuit Mint and Graphite Core).

## Tech Stack & Architecture

*   **Language:** Kotlin
*   **UI Framework:** Jetpack Compose with Material 3
*   **Architecture:** Model-View-ViewModel (MVVM)
*   **Navigation:** Jetpack Navigation for Compose
*   **Networking:** Retrofit & Gson for Google Sheets API integration
*   **Image Handling:** Local drawable resources for efficiency and speed
*   **Camera & ML:** CameraX and ML Kit for high-performance barcode scanning

## Setup & Configuration

This project utilizes a Google Sheet backend via Google Apps Script.

### 1. Google Sheet Setup

The spreadsheet must contain a sheet named `inv` with the following headers:
`NÁZEV`, `RACK`, `POZICE`, `BOX`, `NUMBER`, `ID`, `BARCODE`, `OBRÁZEK`

### 2. Google Apps Script Deployment

1.  Navigate to **Extensions > Apps Script** in your Google Sheet.
2.  Deploy the following script as a Web App:

    ```javascript
    function doGet(e) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("inv");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({error: "Sheet 'inv' not found."})).setMimeType(ContentService.MimeType.JSON);
      }
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      const json = data.map(row => {
        let obj = {};
        headers.forEach((header, index) => { obj[header] = row[index]; });
        return obj;
      });
      return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
    }
    ```

3.  Set access to **Anyone** and copy the generated Web app URL.

### 3. Android Configuration

1.  **API URL:** Update `BASE_URL` in `app/src/main/java/cz/gypridilna/inventarizace/data/network/RetrofitClient.kt`.
2.  **Form URL:** Update `GOOGLE_FORM_URL` in `app/src/main/java/cz/gypridilna/inventarizace/ui/screens/AddItemScreen.kt`.
3.  **Access URL:** Update `ACCESS_SYSTEM_URL` in `app/src/main/java/cz/gypridilna/inventarizace/ui/screens/AccessSystemScreen.kt`.
4.  **Resources:** Ensure required font files and placement images are present in the `res` directory.

## Download

The latest APK is available on the [Releases](https://github.com/JakubRasken/Gypri-Dilna/releases) page.
