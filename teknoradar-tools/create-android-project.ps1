$rootDir = "C:\Users\nurre\.gemini\antigravity-ide\scratch\teknoradar-tools"
$projDir = "$rootDir\android-project"

# Klasörleri oluştur
$dirs = @(
    "$projDir\.github\workflows",
    "$projDir\app\src\main\java\com\teknoradar\tools",
    "$projDir\app\src\main\assets",
    "$projDir\app\src\main\res\values"
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
    }
}

# 1. Assets içine index.html kopyala
Copy-Item "$rootDir\standalone.html" -Destination "$projDir\app\src\main\assets\index.html" -Force

# 2. settings.gradle
$settingsGradle = @"
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = 'TeknoRadarTools'
include ':app'
"@
Set-Content -Path "$projDir\settings.gradle" -Value $settingsGradle -Encoding UTF8

# 3. build.gradle (root)
$rootBuildGradle = @"
plugins {
    id 'com.android.application' version '8.6.1' apply false
}
"@
Set-Content -Path "$projDir\build.gradle" -Value $rootBuildGradle -Encoding UTF8

# 4. gradle.properties
$gradleProps = @"
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
"@
Set-Content -Path "$projDir\gradle.properties" -Value $gradleProps -Encoding UTF8

# 5. .gitignore
$gitignore = @"
.gradle/
build/
local.properties
*.jks
*.keystore
.idea/
*.iml
"@
Set-Content -Path "$projDir\.gitignore" -Value $gitignore -Encoding UTF8

# 6. app/build.gradle
$appBuildGradle = @"
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.teknoradar.tools'
    compileSdk 35

    defaultConfig {
        applicationId 'com.teknoradar.tools'
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName '1.0.0'
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
"@
Set-Content -Path "$projDir\app\build.gradle" -Value $appBuildGradle -Encoding UTF8

# 7. AndroidManifest.xml
$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
Set-Content -Path "$projDir\app\src\main\AndroidManifest.xml" -Value $manifest -Encoding UTF8

# 8. strings.xml
$stringsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">TeknoRadar Tools</string>
</resources>
"@
Set-Content -Path "$projDir\app\src\main\res\values\strings.xml" -Value $stringsXml -Encoding UTF8

# 9. MainActivity.java
$mainActivity = @"
package com.teknoradar.tools;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        setContentView(web);
        if (state != null) {
            web.restoreState(state);
        } else {
            web.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"@
Set-Content -Path "$projDir\app\src\main\java\com\teknoradar\tools\MainActivity.java" -Value $mainActivity -Encoding UTF8

# 10. .github/workflows/android-build.yml (Otomatik AAB/APK Derleyici)
$workflow = @"
name: Android Build

on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.9'
      - name: Build debug APK and release AAB
        run: gradle assembleDebug bundleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: android-build-outputs
          path: |
            app/build/outputs/apk/debug/*.apk
            app/build/outputs/bundle/release/*.aab
          if-no-files-found: error
"@
Set-Content -Path "$projDir\.github\workflows\android-build.yml" -Value $workflow -Encoding UTF8

# 11. README.md
$readme = @"
# TeknoRadar Tools - Android Projesi

Bu proje, **TeknoRadar Tools** uygulamasının Google Play Store uyumlu Android (APK ve AAB) derleme projesidir.

## AAB ve APK Çıktısı Nasıl Alınır?

### 1. YÖNTEM: GitHub Actions ile Otomatik & Ücretsiz (Önerilen)
1. Bu klasörün içeriğini yeni veya mevcut bir GitHub deponuza yükleyin (push edin).
2. GitHub deponuzdaki **Actions** sekmesine gidin.
3. **Android Build** iş akışını seçip **Run workflow** butonuna tıklayın.
4. Yaklaşık 2-3 dakika içinde derleme tamamlanır ve **Artifacts** bölümünden hem `.aab` (Play Store paketi) hem de `.apk` (telefona doğrudan yükleme) dosyalarını tek tıkla indirebilirsiniz.

### 2. YÖNTEM: Android Studio ile Bilgisayarda
1. Android Studio'yu açın.
2. **Open** diyerek bu klasörü (`android-project`) seçin.
3. Gradle senkronizasyonu bittikten sonra:
   - Üst menüden **Build** > **Generate Signed Bundle / APK** seçin.
   - **Android App Bundle (.aab)** seçeneğini işaretleyip ileri deyin.
   - Keystore anahtarınızı seçerek imzalı `.aab` dosyanızı üretin.
"@
Set-Content -Path "$projDir\README.md" -Value $readme -Encoding UTF8

# 12. ZIP Dosyası Oluştur
$zipPath = "$rootDir\teknoradar-tools-android-project.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$projDir\*" -DestinationPath $zipPath -Force

Write-Output "SUCCESS: Android project and ZIP created at $zipPath"
