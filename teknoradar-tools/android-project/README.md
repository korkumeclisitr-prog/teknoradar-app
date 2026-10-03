# TeknoRadar Tools - Android Projesi

Bu proje, **TeknoRadar Tools** uygulamasÄ±nÄ±n Google Play Store uyumlu Android (APK ve AAB) derleme projesidir.

## AAB ve APK Ã‡Ä±ktÄ±sÄ± NasÄ±l AlÄ±nÄ±r?

### 1. YÃ–NTEM: GitHub Actions ile Otomatik & Ãœcretsiz (Ã–nerilen)
1. Bu klasÃ¶rÃ¼n iÃ§eriÄŸini yeni veya mevcut bir GitHub deponuza yÃ¼kleyin (push edin).
2. GitHub deponuzdaki **Actions** sekmesine gidin.
3. **Android Build** iÅŸ akÄ±ÅŸÄ±nÄ± seÃ§ip **Run workflow** butonuna tÄ±klayÄ±n.
4. YaklaÅŸÄ±k 2-3 dakika iÃ§inde derleme tamamlanÄ±r ve **Artifacts** bÃ¶lÃ¼mÃ¼nden hem .aab (Play Store paketi) hem de .apk (telefona doÄŸrudan yÃ¼kleme) dosyalarÄ±nÄ± tek tÄ±kla indirebilirsiniz.

### 2. YÃ–NTEM: Android Studio ile Bilgisayarda
1. Android Studio'yu aÃ§Ä±n.
2. **Open** diyerek bu klasÃ¶rÃ¼ (ndroid-project) seÃ§in.
3. Gradle senkronizasyonu bittikten sonra:
   - Ãœst menÃ¼den **Build** > **Generate Signed Bundle / APK** seÃ§in.
   - **Android App Bundle (.aab)** seÃ§eneÄŸini iÅŸaretleyip ileri deyin.
   - Keystore anahtarÄ±nÄ±zÄ± seÃ§erek imzalÄ± .aab dosyanÄ±zÄ± Ã¼retin.
