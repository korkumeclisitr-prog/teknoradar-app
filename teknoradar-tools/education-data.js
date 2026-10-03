/* education-data.js — TeknoRadar Tools
   19 aracın tamamı için teknik olarak doğru, sade, öğrenci dostu eğitim veri tabanı. */

window.TOOL_EDUCATION = {
  qr: {
    whatSimple: "QR Kod (Karekod), harfleri, internet linklerini veya Wi-Fi şifrelerini siyah-beyaz karelerden oluşan iki boyutlu bir desene dönüştüren görsel bir barkoddur. Akıllı telefon kamerası bu deseni saniyeler içinde okuyup çözebilir.",
    whatTechnical: "QR Kod (Quick Response Code - ISO/IEC 18004), veriyi 2 boyutlu matris biçiminde depolayan optik bir barkoddur. Sayısal, alfanümerik ve ikili (bayt) modlarını destekler; hasar görse bile verinin okunabilmesini sağlayan Reed-Solomon hata düzeltme algoritmasını kullanır.",
    purpose: [
      "Web sitesi linklerini (URL) klavyeden yazmadan doğrudan açmak",
      "Karmaşık Wi-Fi şifrelerini misafirlerle zahmetsizce paylaşmak",
      "Restoran menüleri, broşürler ve biletlerde hızlı erişim sağlamak",
      "Dijital kartvizit, e-posta veya telefon numaralarını anında iletmek"
    ],
    how: [
      { title: "Veri Girişi & Mod Seçimi", desc: "Kullanıcının girdiği metin veya bağlantı analiz edilir; UTF-8 bayt kodlama standardına çevrilir." },
      { title: "Hata Düzeltme Kodlaması (Reed-Solomon)", desc: "Kodun kirlenme veya yıpranma payına karşı matematiksel hata düzeltme blokları (L/M/Q/H) eklenir." },
      { title: "Matris & Pozisyon Deseni", desc: "Üç köşeye hizalama kareleri (Finder Patterns) ve zamanlama çizgileri yerleştirilir." },
      { title: "Maskeleme & Optimizasyon", desc: "Kameranın okumasını zorlaştıracak ardışık desenleri kırmak için 8 standart maskeden en dengelisi seçilir." },
      { title: "SVG Vektör Çizimi", desc: "Matris pikselleri cihazınızda yerel olarak SVG formatında çizilir; sunucuya hiçbir veri gitmez." }
    ],
    example: {
      input: "https://teknoradar.com",
      process: "UTF-8 bayt modu -> Reed-Solomon Seviye L -> 21x21 Matris -> Maske 4",
      output: "[21x21 piksel boyutunda taranabilir QR matrisi]"
    },
    tips: [
      "QR koda ne kadar çok metin yazarsanız kareler o kadar küçülür ve kameranın okuması zorlaşır. URL kısaltıcı veya sade linkler tercih edin.",
      "Wi-Fi QR kodu oluştururken şifreniz kodun içine açık metin olarak gömülür; yalnızca güvendiğiniz kişilere gösterin."
    ]
  },

  json: {
    whatSimple: "JSON, bilgisayarlar ve yazılımların birbirleriyle konuşurken kullandığı, hem insanların okuyabileceği kadar düzenli hem de programların anlayabileceği kadar net bir veri taşıma dilidir. Dağınık bir metni çekmecelerine göre düzenlemek gibidir.",
    whatTechnical: "JSON (JavaScript Object Notation - RFC 8259), anahtar-değer (key-value) çiftleri ve sıralı listelerden (array) oluşan, metin tabanlı, dilden bağımsız bir veri değişim formatıdır. Web API'leri ve modern veri tabanlarında standarttır.",
    purpose: [
      "Mobil/web uygulamaları ile sunucu arasındaki veri trafiğini biçimlendirmek",
      "Karmaşık ve tek satıra sıkışmış log dosyalarını okunabilir hale getirmek (Beautify)",
      "Veri boyutunu küçültmek ve ağ transferini hızlandırmak için sıkıştırmak (Minify)",
      "Sözdizimi (syntax) hatalarını tarayıcıda anında tespit etmek"
    ],
    how: [
      { title: "Girdi & Metin Alımı", desc: "Metin kutusundaki karakter dizisi bellek tamponuna aktarılır." },
      { title: "Lexical & Syntax Analizi", desc: "Tarayıcının yerel JSON.parse() motoru süslü parantezleri, tırnakları ve virgülleri denetler." },
      { title: "Soyut Sözdizimi Ağacı (AST)", desc: "Veri, JavaScript nesnesi olarak hiyerarşik bellek yapısına dönüştürülür." },
      { title: "Formatlama & Girintileme", desc: "JSON.stringify() ile seçilen boşluk kadar (2 veya 4 boşluk) satır atlamaları eklenir." },
      { title: "Çıktı & Doğrulama", desc: "Syntax hatası varsa satır/karakter konumu belirtilir; hatasızsa renklendirilmiş çıktı üretilir." }
    ],
    example: {
      input: '{"ad":"TeknoRadar","aktif":true}',
      process: "JSON.parse() ile denetle -> 2 boşluk girintiyle JSON.stringify(data, null, 2)",
      output: '{\n  "ad": "TeknoRadar",\n  "aktif": true\n}'
    },
    tips: [
      "JSON standartlarında tek tırnak ('...') geçersizdir; anahtar ve metin değerleri mutlaka çift tırnak (\"...\") ile yazılmalıdır.",
      "Son elemandan sonra konulan virgül (trailing comma) JSON standardına aykırıdır ve parser hatası üretir."
    ]
  },

  base64: {
    whatSimple: "Base64, ikili (binary) verileri veya özel sembolleri, yalnızca herkesin klavyesinde bulunan 64 güvenli karaktere (A-Z, a-z, 0-9, +, /) çevirme yöntemidir. Bir mektubu hasar görmeden taşımak için koruyucu zarfa koymaya benzer.",
    whatTechnical: "Base64 (RFC 4648), 8-bitlik ikili bayt dizilerini 6-bitlik bloklara bölerek 64 basamaklı bir ASCII alfabesine eşleyen bir kodlama (encoding) algoritmasıdır. Veri boyutunu yaklaşık %33 oranında büyütür. Şifreleme (encryption) DEĞİLDİR; sadece biçim dönüşümüdür.",
    purpose: [
      "Küçük resimleri ve fontları HTML veya CSS içine doğrudan gömmek (Data URL)",
      "E-postalarda dosya eklerini (MIME) güvenle iletmek",
      "API isteklerinde kimlik bilgilerini (Basic Auth) standart metin olarak göndermek",
      "İkili veri paketlerini metin tabanlı iletişim kanallarında bozulmadan taşımak"
    ],
    how: [
      { title: "Metinden Bayta Çevrim", desc: "TextEncoder ile UTF-8 karakterleri 8 bitlik (1 bayt) sayı dizisine çevrilir." },
      { title: "24-Bit Bloklama", desc: "Her 3 adet 8-bitlik bayt (toplam 24 bit) yan yana getirilir." },
      { title: "6-Bit Parçalama", desc: "Bu 24 bit, 4 adet 6-bitlik parçaya bölünür (2^6 = 64 farklı değer)." },
      { title: "Base64 Tablo Eşlemesi", desc: "Her 6-bitlik sayı, Base64 dizinindeki karşılık gelen karaktere dönüştürülür." },
      { title: "Doldurma (Padding)", desc: "Bayt sayısı 3'ün katı değilse eksik kısımlar sonuna '=' karakteri eklenerek tamamlanır." }
    ],
    example: {
      input: "Tekno",
      process: "Baytlar: [84, 101, 107, 110, 111] -> 6-bit bloklama -> Base64 indeks",
      output: "VGVrbm8="
    },
    tips: [
      "Base64 şifreleme değildir! Herkes tek tıklamayla Base64 verisini orijinal haline geri çevirebilir; hassas şifreleri Base64 ile gizlemeyin.",
      "Büyük dosyaları Base64 yapmak dosya boyutunu 1/3 oranında artıracağı için performans kaybına neden olabilir."
    ]
  },

  color: {
    whatSimple: "Renk dönüştürücü; bilgisayar ekranlarının, tasarımcıların ve yazılımcıların aynı rengi ifade etmek için kullandığı farklı 'lehçeler' (HEX, RGB ve HSL) arasında anında çeviri yapan bir dijital palettir.",
    whatTechnical: "Renk uzayları dönüşüm modülü; 24-bit sRGB tabanında HEX (#RRGGBB), ondalık RGB (0-255 aralığı) ve silindirik renk modeli HSL (Ton 0-360°, Doygunluk 0-100%, Açıklık 0-100%) koordinat dönüşümlerini matematiksel formüllerle gerçekleştirir.",
    purpose: [
      "Web tasarımında CSS renk kodlarını düzenlemek",
      "HEX formatındaki bir rengin şeffaflık (alpha) veya HSL varyasyonlarını türetmek",
      "Marka renk rehberlerindeki tonları farklı tasarım programlarına aktarmak",
      "Karanlık mod için bir rengin sadece açıklık (L) değerini değiştirip tonunu korumak"
    ],
    how: [
      { title: "Girdi Algılama & Normalizasyon", desc: "Girdinin '#' ile başlayan HEX mi, 'rgb()' mi yoksa 'hsl()' mi olduğu tespit edilir." },
      { title: "Temel RGB Koordinatına Çevrim", desc: "HEX 16'lık tabandan 10'luk tabana (0-255) çözülür veya HSL ters dönüşümle RGB'ye çevrilir." },
      { title: "Normalizasyon & Matris Analizi", desc: "R, G, B değerleri 255'e bölünerek [0, 1] aralığına indirgenir; Min ve Max tepe noktaları bulunur." },
      { title: "Hue / Saturation / Lightness", desc: "Açıklık ortalama ile, Doygunluk fark oranı ile, Ton ise en baskın renk kanalının açısıyla hesaplanır." },
      { title: "Canlı Önizleme", desc: "Hesaplanan tüm formatlar UI listesine yazılır ve renk kutusu CSS ile canlı boyanır." }
    ],
    example: {
      input: "#00D4FF",
      process: "R: 0 (0x00), G: 212 (0xD4), B: 255 (0xFF) -> HSL hesaplama",
      output: "RGB: rgb(0, 212, 255) | HSL: hsl(190, 100%, 50%)"
    },
    tips: [
      "Bir rengin tonunu bozmadan koyulaştırmak veya açmak için HSL'deki 'L' (Lightness) değerini artırıp azaltmak en doğal sonucu verir.",
      "Kısa HEX kodları (örneğin #03F), tarayıcı tarafından otomatik olarak #0033FF şeklinde genişletilir."
    ]
  },

  device: {
    whatSimple: "Cihaz Bilgileri aracı; tarayıcınızın donanımınız, işletim sisteminiz ve pil/bellek gibi fiziksel özellikleriniz hakkında web siteleriyle paylaştığı teknik kimlik kartını size gösterir.",
    whatTechnical: "W3C Navigator API, Hardware Concurrency API ve Device Memory API aracılığıyla istemci tarafında sorgulanan çevre birimi ve çalışma zamanı (runtime) metrikleridir. Hiçbir harici telemetri sunucusuna başvurulmaz.",
    purpose: [
      "Kullanılan cihazın donanım kapasitesini (işlemci çekirdeği, RAM) öğrenmek",
      "Mobil/masaüstü tarayıcı uyumluluklarını ve platform mimarisini test etmek",
      "Web sitelerinin arka planda tarayıcınızdan hangi bilgileri alabildiğini denetlemek (Gizlilik)",
      "PWA ve çevrimdışı (offline) yeteneklerini doğrulamak"
    ],
    how: [
      { title: "Navigator Nesnesi Erişimi", desc: "window.navigator üzerinden donanım değişkenleri okunur." },
      { title: "İşlemci & Bellek Taraması", desc: "hardwareConcurrency ile mantıksal CPU çekirdek sayısı, deviceMemory ile yaklaşık RAM sorgulanır." },
      { title: "Dokunmatik & Giriş Kontrolü", desc: "maxTouchPoints ve ontouchstart desteği kontrol edilerek cihaz sınıfı doğrulanır." },
      { title: "Zaman Dilimi & Dil", desc: "Intl.DateTimeFormat().resolvedOptions() ile sistem saat dilimi çözülür." },
      { title: "Güvenli Gösterim", desc: "Tarayıcının gizlilik kısıtlaması nedeniyle desteklemediği alanlar güvenle 'Desteklenmiyor' olarak etiketlenir." }
    ],
    example: {
      input: "Sistem sorgusu",
      process: "navigator.hardwareConcurrency, navigator.platform vb. API çağrıları",
      output: "Platform: Win32/x64 | Çekirdek: 8-16 | Dil: tr-TR"
    },
    tips: [
      "Tarayıcılar gizliliği korumak ve 'cihaz parmak izi' (fingerprinting) çıkarılmasını zorlaştırmak için RAM miktarını tam değer yerine yaklaşık (örn. 8 GB) bildirir.",
      "Bu veriler internet kapalıyken bile cihazınız tarafından anında sağlanır."
    ]
  },

  screen: {
    whatSimple: "Ekran Bilgileri; telefonunuzun veya monitörünüzün kaç piksel olduğunu, piksel yoğunluğunu (Retina netliğini) ve ekranınızın dikey mi yatay mı durduğunu ölçen teknik bir cetveldir.",
    whatTechnical: "Window Screen API, viewport metrikleri (innerWidth/innerHeight) ve window.devicePixelRatio (DPR) kullanılarak CSS pikselleri ile panelin fiziksel donanım pikselleri arasındaki ölçekleme çarpanını hesaplayan analiz aracıdır.",
    purpose: [
      "Web sitelerinin responsive (mobil uyumlu) kırılma noktalarını (breakpoints) test etmek",
      "Yüksek yoğunluklu (Retina / OLED) ekranların piksel çarpanını (DPR) öğrenmek",
      "Oyun ve grafik uygulamalarında tam ekran render çözünürlüğünü optimize etmek",
      "Ekran yönü (portrait/landscape) değişikliklerini anlık izlemek"
    ],
    how: [
      { title: "CSS Görünüm Alanı (Viewport)", desc: "Tarayıcının içeriği çizdiği alan window.innerWidth ve innerHeight ile milisaniyelik ölçülür." },
      { title: "Fiziksel Ekran Boyutu", desc: "screen.width ve screen.height ile monitör/ekran panelinin sınırları tespit edilir." },
      { title: "Device Pixel Ratio (DPR) Çarpanı", desc: "1 CSS pikseline kaç fiziksel donanım pikseli düştüğü oranlanır (Örn: 2x veya 3x Retina)." },
      { title: "Fiziksel Piksel Çarpımı", desc: "screen.width * DPR işlemiyle donanımın gerçek çözünürlüğü tam sayıyla hesaplanır." },
      { title: "Canlı Olay Dinleyicisi", desc: "Pencere boyutu veya ekran yönü değiştiğinde (resize/orientation) tablo anında güncellenir." }
    ],
    example: {
      input: "1080p Telefon Ekranı (DPR: 3.0)",
      process: "Viewport: 390x844 CSS px * 3.0 DPR",
      output: "Fiziksel: 1170 x 2532 px | Renk Derinliği: 24 bit"
    },
    tips: [
      "Tasarım yaparken piksel boyutunu fiziksel piksellere göre değil, daima CSS viewport genişliğine (360px - 430px mobil standartları) göre planlamalısınız.",
      "Ekranınızı yakınlaştırıp uzaklaştırdığınızda (Ctrl + / Ctrl -) DPR değeri dinamik olarak değişir."
    ]
  },

  network: {
    whatSimple: "Ağ Bilgileri aracı; cihazınızın internete bağlı olup olmadığını, bağlantı tipini (4G/Wi-Fi vb.) ve tahmini gecikme süresini (ping) kontrol eden bir ağ tanı merkezidir.",
    whatTechnical: "W3C Network Information API (navigator.connection) ve navigator.onLine durumunu okuyarak RTT (Round Trip Time), downlink bant genişliği ve Save-Data (veri tasarrufu) bayraklarını değerlendiren yerel bağlantı profili aracıdır.",
    purpose: [
      "İnternet bağlantısının anlık olarak aktif olup olmadığını teyit etmek",
      "Mobil bağlantı hızını (4G/3G) ve sunucuya gidiş-dönüş gecikmesini (RTT ms) tahmin etmek",
      "Kullanıcının 'Veri Tasarrufu Modu' açık olup olmadığını denetlemek",
      "Web uygulamalarında offline/online geçiş durumlarını test etmek"
    ],
    how: [
      { title: "Online Durumu Kontrolü", desc: "navigator.onLine boolean değeriyle cihazın ağ kartı bağlantısı sorgulanır." },
      { title: "Connection API Erişimi", desc: "Tarayıcının navigator.connection nesnesi kontrol edilir (Chromium/Android desteklidir)." },
      { title: "Gecikme (RTT) & Hız (Downlink)", desc: "Son ağ paketlerinden hesaplanan yaklaşık paket gidiş-dönüş süresi (ms) ve megabit hızı okunur." },
      { title: "Etkin Bağlantı Sınıflandırması", desc: "Ağ performansı hücresel standartlara (slow-2g, 2g, 3g, 4g) göre kategorilenir." },
      { title: "Reaktif Güncelleme", desc: "Cihaz uçak moduna alındığında veya ağ değiştiğinde 'online' ve 'offline' eventleri tabloyu yeniler." }
    ],
    example: {
      input: "Wi-Fi / Fiber Bağlantı",
      process: "navigator.connection değerleri okunur",
      output: "Durum: Çevrimiçi | Tür: 4g | RTT: ~50 ms | Downlink: ~10 Mbps"
    },
    tips: [
      "Buradaki RTT ve Downlink değerleri hız testi (Speedtest) değil; tarayıcının son yaptığı HTTP isteklerinden çıkardığı tahmini değerlerdir.",
      "iOS Safari gizlilik politikası gereği Network Information API'yi kısıtlar; yalnızca online/offline durumu güvenle bildirilir."
    ]
  },

  storage: {
    whatSimple: "Depolama Dönüştürücü; telefon, flaş bellek veya hard disk alırken üreticilerin kullandığı 1000'lik hesap ile bilgisayarların kullandığı 1024'lük hesap arasındaki farkı ve tüm boyut birimlerini birbirine çeviren bir çeviricidir.",
    whatTechnical: "Uluslararası Ölçü Sistemi (SI - Decimal tabanlı: KB, MB, GB, 10^3) ile Uluslararası Elektroteknik Komisyonu (IEC - İkili tabanlı: KiB, MiB, GiB, 2^10) veri depolama birimleri arasındaki matematiksel dönüşümleri hassas kayan nokta aritmetiğiyle hesaplar.",
    purpose: [
      "Neden '500 GB' olarak satılan bir diskin bilgisayarda '465 GB' göründüğünü anlamak",
      "Megabayt (MB) ile Gigabayt (GB) ve Terabayt (TB) arasındaki dosya dönüşümlerini yapmak",
      "Veritabanı ve sunucu bellek kapasitelerini doğru birimlerle hesaplamak",
      "Mobil veri kotalarını bayt seviyesinde analiz etmek"
    ],
    how: [
      { title: "Kullanıcı Değeri & Birimi", desc: "Girilen sayısal değer ve seçilen başlangıç birimi alınır." },
      { title: "Taban Seçimi (1000 vs 1024)", desc: "Kullanıcının seçtiği sisteme göre temel çarpan (1000 veya 1024) belirlenir." },
      { title: "Temel Bayt (Byte) Değerine İndirgeme", desc: "Değer, seçilen birimin katı ile çarpılarak en küçük birim olan Bayt'a çevrilir (bytes = value * base^n)." },
      { title: "Tüm Birim Basamaklarına Bölme", desc: "Elde edilen bayt miktarı sırasıyla B, KB, MB, GB ve TB basamaklarına bölünür." },
      { title: "Yerel Sayı Biçimlendirmesi", desc: "Sonuçlar Türkçe sayı standartlarına (ondalık virgülü) göre yuvarlanarak listelenir." }
    ],
    example: {
      input: "1 GB (İkili / Binary modda)",
      process: "1 * 1024 * 1024 * 1024 = 1.073.741.824 Bayt",
      output: "1.048.576 KiB | 1.024 MiB | 1 GiB | 0.000976 TiB"
    },
    tips: [
      "Hard disk üreticileri 1 GB = 1.000.000.000 Bayt (1000'li) hesaplar. Ancak Windows işletim sistemi 1024'lü ikili hesap yaptığı için aldığınız diskler her zaman kutuda yazandan yaklaşık %7 daha az görünür.",
      "Doğru terim kullanımı: 1000'li olanlar KB/MB/GB, 1024'lü olanlar ise KiB/MiB/GiB (Kibibyte, Mebibyte, Gibibyte) olarak adlandırılır."
    ]
  },

  timestamp: {
    whatSimple: "Zaman Damgası (Unix Timestamp), tüm dünyadaki bilgisayarların saat farkı veya yaz/kış saati karmaşası olmadan zamanı kaydetmek için kullandığı evrensel kronometredir: 1 Ocak 1970'ten şu ana kadar geçen toplam saniye sayısıdır.",
    whatTechnical: "Unix Epoch (1 Ocak 1970 00:00:00 UTC) referans anından itibaren geçen saniye (POSIX zamanı) veya milisaniye cinsinden tamsayı değerdir. Saat dilimlerinden bağımsız (UTC) olduğu için dağıtık veritabanlarında ve log kayıtlarında standarttır.",
    purpose: [
      "Veritabanlarında kayıt oluşturma/güncelleme anlarını saat dilimi karmaşası olmadan saklamak",
      "API'lerden dönen '1735689600' gibi sayıları okunabilir tarih ve saate çevirmek",
      "İki işlem arasında tam olarak kaç milisaniye geçtiğini hesaplamak",
      "Gelecekteki bir tarih için geri sayım veya süre aşımı (timeout) kurmak"
    ],
    how: [
      { title: "Zaman Damgası Girişi", desc: "Sayısal zaman damgası veya tarih-saat seçimi alınır." },
      { title: "Saniye / Milisaniye Ayrımı", desc: "Girdi 10 basamaklıysa saniye (1000 ile çarpılır), 13 basamaklıysa doğrudan milisaniyedir." },
      { title: "JavaScript Date Nesnesi", desc: "new Date(milisaniye) ile yerel bellek saat nesnesi üretilir." },
      { title: "Yerel & UTC Ayrıştırma", desc: "Cihazın saat dilimine göre yerel saat (tr-TR) ve Greenwich merkezli UTC metni oluşturulur." },
      { title: "Çift Yönlü Çevrim", desc: "Tarih seçildiğinde date.getTime() çağrısıyla saniye/milisaniye tam sayıları hesaplanır." }
    ],
    example: {
      input: "1735689600 (Saniye)",
      process: "1735689600 * 1000 = 1735689600000 ms -> Date nesnesi",
      output: "Yerel Saat: 01.01.2025 03:00:00 (UTC+3) | UTC: Wed, 01 Jan 2025 00:00:00 GMT"
    },
    tips: [
      "Yıl 2038 Problemi: Eski 32-bit sistemlerde zaman damgası 19 Ocak 2038'de taşma yaparak 1901 yılına geri dönecektir; modern sistemler bu yüzden 64-bit tam sayılar kullanır.",
      "JavaScript'te Date.now() milisaniye (13 basamak), Linux ve PHP gibi dillerde time() varsayılan olarak saniye (10 basamak) üretir."
    ]
  },

  regex: {
    whatSimple: "Regex (Düzenli İfadeler), devasa bir metin yığını içinde aradığınız bir kelimeyi değil, aradığınız 'deseni' (örneğin tüm telefon numaralarını, e-posta adreslerini veya vergi numaralarını) tek hamlede bulan sihirli bir büyüteçtir.",
    whatTechnical: "Düzenli İfadeler (Regular Expressions - ECMA-262 RegExp standardı), sonlu durum makineleri (NFA/DFA) prensibiyle çalışan bir kalıp eşleme motorudur. Metin tarama, doğrulama (validation), arama-değiştirme ve yakalama grupları (capture groups) işlemlerini yürütür.",
    purpose: [
      "Formlarda e-posta, T.C. kimlik no veya şifre kurallarını denetlemek (Validation)",
      "Büyük log veya kod dosyalarından belirli formatlardaki IP/URL adreslerini ayıklamak",
      "Metin içindeki belirli kalıpları toplu olarak değiştirmek veya sansürlemek",
      "Web scraping ve veri temizleme işlemlerinde desenleri yakalamak"
    ],
    how: [
      { title: "Desen & Bayrak Derlemesi", desc: "Desen metni ve bayraklar (g: global, i: case-insensitive, m: multiline) RegExp sınıfıyla derlenir." },
      { title: "Sözdizimi Denetimi", desc: "Kapatılmamış parantez veya geçersiz kaçış karakterleri varsa hata anında yakalanır." },
      { title: "String Taraması (matchAll)", desc: "Kaynak metin üzerinde eşleşmeler ve pozisyon indeksleri tek tek aranır." },
      { title: "Yakalama Grupları (Groups)", desc: "Parantez içi gruplar ve adlandırılmış gruplar (named groups) listelenir." },
      { title: "Vurgulama (Highlighting)", desc: "Eşleşen kısımlar DOM üzerinde sarı/mavi neon renkli <mark> etiketleriyle işaretlenir." }
    ],
    example: {
      input: "Desen: \\b\\w+@\\w+\\.\\w+ | Metin: 'Bize destek@teknoradar.com adresinden ulaşın.'",
      process: "E-posta kalıbı aranır -> pozisyon 12'de yakalanır",
      output: "Eşleşme #1: 'destek@teknoradar.com' (İndeks: 12)"
    },
    tips: [
      "Karmaşık ve iç içe tekrar eden desenler (örneğin (a+)+) uzun metinlerde 'Catastrophic Backtracking' denen sonsuz döngüye girip tarayıcıyı dondurabilir; açgözlü (greedy) operatörleri dikkatli kullanın.",
      "Regex bayraklarından 'g' (global) seçilmezse motor sadece bulduğu ilk eşleşmeyi döndürür ve durur."
    ]
  },

  jwt: {
    whatSimple: "JWT (JSON Web Token), bir otel kapı kartı gibidir. Otel resepsiyonu karta adınızı, oda numaranızı ve kartın geçerlilik süresini yükler ve altına dijital bir mühür basar. Kapıdan geçerken kart okunur; süresi dolmamışsa ve mühür sağlamsa içeri alınırsınız.",
    whatTechnical: "JWT (RFC 7519), iki taraf arasında güvenli şekilde JSON veri nesneleri aktaran kompakt, URL-safe bir açık standarttır. Noktayla ayrılmış üç kısımdan oluşur: Header (algoritma), Payload (iddialar/claims: sub, iat, exp) ve Signature (HMAC/RSA imzası).",
    purpose: [
      "Kullanıcı giriş yaptıktan sonra oturum durumunu (Stateless Auth) taşımak",
      "Mikroservisler arasında kullanıcı rol ve yetki (Role-Based Access) bilgilerini aktarmak",
      "Tek seferlik parola sıfırlama veya e-posta doğrulama linkleri üretmek",
      "Mobil uygulamalarda her API isteğinde kimlik doğrulamak (Bearer Token)"
    ],
    how: [
      { title: "Token Parçalama", desc: "JWT dizesi iki noktadan (.) bölünerek 3 parçaya ayrılır: Header, Payload, İmza." },
      { title: "Base64URL Çözümleme", desc: "URL güvenli Base64 ('-' ve '_' karakterleri '+' ve '/' yapılarak) UTF-8 baytlarına çözülür." },
      { title: "JSON Parse & Çıkarım", desc: "Başlık ve gövde geçerli JSON nesnelerine dönüştürülür." },
      { title: "Süre (Exp) Denetimi", desc: "Payload içindeki 'exp' zaman damgası şu anki saniye (Date.now()/1000) ile kıyaslanır." },
      { title: "İstemci Tarafı Güvenlik Notu", desc: "Bu araç token içeriğini gösterir; imzanın geçerli olup olmadığı sunucunun gizli anahtarı olmadan doğrulanamaz." }
    ],
    example: {
      input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiS2FhbiJ9.imza",
      process: "Base64URL decode -> Header & Payload JSON nesnesine çevrilir",
      output: 'Header: {"alg":"HS256"} | Payload: {"sub":"123456", "name":"Kaan"}'
    },
    tips: [
      "JWT şifreli değildir! Sadece Base64 ile paketlenmiştir. Tokeni eline geçiren herkes içindeki verileri okuyabilir. Bu yüzden JWT içine asla kredi kartı veya şifre yazılmamalıdır.",
      "JWT imzasını yalnızca sunucu tarafı gizli anahtarıyla (Secret Key) doğrulayabilir. Tarayıcıda tokenin çözülebilmesi güvenli olduğu anlamına gelmez."
    ]
  },

  hash: {
    whatSimple: "Hash (Özet), herhangi bir metnin veya dosyanın 'dijital parmak izidir'. 1 harflik kelime de verseniz, 100 sayfalık kitap da verseniz, hash algoritması her zaman sabit uzunlukta benzersiz bir kod üretir. Verideki tek bir virgül bile değişse parmak izi tamamen tanınmaz şekilde değişir.",
    whatTechnical: "Kriptografik özet fonksiyonu (Cryptographic Hash Function); değişken uzunluktaki bir girdiyi deterministik, tek yönlü (one-way), çakışmaya dirençli (collision-resistant) ve sabit uzunlukta bir çıktıya (özete) dönüştüren matematiksel algoritmadır. Geri döndürülemez (şifre çözme işlemi yoktur).",
    purpose: [
      "İndirilen dosyaların veya yazılımların bozulmadığını ya da virüslü olmadığını doğrulamak (Checksum)",
      "Veritabanlarında kullanıcı şifrelerini açık metin yerine güvenle saklamak",
      "Blokzincir (Blockchain) sistemlerinde blokların birbirine zincirlenmesini sağlamak",
      "İki dosyanın içeriğinin aynı olup olmadığını dosyaları açmadan karşılaştırmak"
    ],
    how: [
      { title: "Metin veya Dosya Girdisi", desc: "Kullanıcı verisi UTF-8 bayt dizisi veya Uint8Array olarak belleğe alınır." },
      { title: "Doldurma & Bloklama (Padding)", desc: "Verinin sonuna 1 biti ve veri uzunluğu eklenerek 512 bitlik bloklara tamamlanır." },
      { title: "Matematiksel Sıkıştırma Turu", desc: "Her blokta sabit mantıksal fonksiyonlar (bitwise XOR, AND, ROTR, asal sayı sabitleri) onlarca tur uygulanır." },
      { title: "Çığ Etkisi (Avalanche Effect)", desc: "Girdideki tek 1 bitlik değişim çıktıdaki bitlerin en az %50'sinin değişmesini sağlar." },
      { title: "Hexadecimal Çıktı", desc: "Hesaplanan nihai 128 bit (MD5), 160 bit (SHA-1), 256 bit (SHA-256) veya 512 bit (SHA-512) 16'lık tabanda yazdırılır." }
    ],
    example: {
      input: "Hello",
      process: "SHA-256 algoritması (Web Crypto API veya saf JS motoru)",
      output: "185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969"
    },
    tips: [
      "Hash ile Şifreleme (Encryption) arasındaki en büyük fark: Şifrelenmiş verinin bir anahtarı vardır ve geri çözülebilir. Hash ise tek yönlüdür; üretilen hash değerinden orijinal veriyi geri getirmek matematiksel olarak imkansızdır.",
      "MD5 ve SHA-1 algoritmaları eski ve güvenlik açıkları (çakışma zafiyeti) bulunduğu için artık parola güvenliğinde kullanılmaz; modern projelerde en az SHA-256 veya bcrypt/argon2 tercih edilmelidir."
    ]
  },

  html2aab: {
    whatSimple: "HTML → AAB aracı; tek sayfalık HTML, CSS ve JavaScript kodlarınızı, Google Play Store'a yüklenebilen veya Android telefonlara kurulabilen gerçek bir mobil uygulamaya dönüştürmek için gereken tam teşekküllü Android Studio projesini hazırlar.",
    whatTechnical: "İstemci tarafında sıfır bağımlılıkla (saf JS ZipLib ile) Android SDK 35 ve Gradle 8.9 uyumlu bir Android WebView wrapper projesi (.zip) üretir. AndroidManifest.xml, MainActivity.java, derleme betikleri ve otomatik GitHub Actions CI/CD iş akışını içerir.",
    purpose: [
      "Web sitelerini veya web tabanlı araçları mobil Android uygulaması (APK/AAB) olarak paketlemek",
      "Google Play Store'un zorunlu kıldığı Android App Bundle (.aab) formatına hazır kod yapısı kurmak",
      "Kişisel bilgisayara ağır Android Studio kurmadan GitHub Actions bulutunda otomatik derleme yapmak",
      "Çevrimdışı çalışan HTML oyunlarını veya araçlarını mağazada yayınlamak"
    ],
    how: [
      { title: "HTML & Dosyaların Toplanması", desc: "Seçilen HTML ana dosya olarak 'assets/index.html' konumuna atanır, ek resim/CSS dosyaları taranır." },
      { title: "Paket & Kimlik Doğrulaması", desc: "Girilen paket adı (com.teknoradar.app) Java standartlarına ve anahtar kelime kurallarına göre denetlenir." },
      { title: "Native Java & Manifest Üretimi", desc: "Tam ekran WebView, geri tuşu kontrolü ve donanım hızlandırma kodları MainActivity.java içine yazılır." },
      { title: "Gradle & GitHub Actions Entegrasyonu", desc: "Bulutta tek tıkla APK ve AAB üreten .github/workflows/android-build.yml dosyası oluşturulur." },
      { title: "İstemci Tarafında ZIP Arşivleme", desc: "Tarayıcı içindeki ZipLib ile tüm dosya ağacı CRC-32 sağlama toplamlarıyla sıkıştırılıp anında indirilir." }
    ],
    example: {
      input: "index.html (HTML + CSS + JS)",
      process: "Android projesi ağacı oluşturulur -> Gradle konfigürasyonu -> ZIP paketleme",
      output: "app-android-project.zip (GitHub Actions ile doğrudan derlenebilir)"
    },
    tips: [
      "Tarayıcı tek başına bir Java/Android derleyicisi değildir. Bu araç derlenmeye hazır tam projeyi verir. İndirdiğiniz ZIP'i ücretsiz bir GitHub deposuna yüklediğinizde Actions sekmesi sizin yerinize APK ve AAB dosyasını bulutta otomatik derler!",
      "Google Play Store'a yükleyeceğiniz AAB dosyasını kendi dijital anahtarınızla (Keystore) imzalamanız gerekir; GitHub Secrets kullanarak bu anahtarı gizli tutabilirsiniz."
    ]
  },

  uuid: {
    whatSimple: "UUID, evrende üretilen milyarlarca veri arasında bile asla bir başkasıyla çakışmayacak kadar benzersiz, 36 karakterlik 'evrensel dijital kimlik numarasıdır'.",
    whatTechnical: "Universally Unique Identifier (RFC 4122 / RFC 9562); 128 bitlik bir sayının 8-4-4-4-12 formatında onaltılık tabanda gösterimidir. v4 tamamen kriptografik rastgele sayılara (CSPRNG), v7 ise Unix zaman damgası milisaniyesi ile rastgele entropinin birleşimine dayanır.",
    purpose: [
      "Veritabanlarında birbiri ardına artan (1, 2, 3...) ID'ler yerine tahmin edilemeyen güvenli anahtarlar kullanmak",
      "Farklı sunucuların ortak bir merkeze sormadan aynı anda çakışmasız benzersiz ID üretebilmesi",
      "Kullanıcı oturum kimlikleri (Session ID) ve sipariş numaraları oluşturmak",
      "v7 ile veritabanı indekslerinde zamana göre doğal sıralı (B-Tree dostu) kayıtlar tutmak"
    ],
    how: [
      { title: "Kriptografik Entropi Kaynağı", desc: "window.crypto.getRandomValues() ile donanım seviyesinde güvenli 16 bayt üretilir." },
      { title: "Zaman Entegrasyonu (v7)", desc: "v7 seçilmişse ilk 48 bite Date.now() milisaniyesi yerleştirilerek zamana duyarlı yapılır." },
      { title: "Versiyon & Varyant İğneleme", desc: "7. baytın üst 4 biti versiyona (0x40 veya 0x70), 9. baytın üst 2 biti RFC varyantına (0x80) sabitlenir." },
      { title: "Hexadecimal Dönüşüm", desc: "Her bayt 2 basamaklı 16'lık tabana dönüştürülür ve aralara standart tire (-) işaretleri yerleştirilir." },
      { title: "Toplu Üretim & Kopyalama", desc: "İstenen adet kadar döngü çalıştırılır; tek tıkla kopyalama listesi hazırlanır." }
    ],
    example: {
      input: "Sürüm: v4 (Rastgele)",
      process: "128-bit CSPRNG entropisi -> versiyon 4 ve RFC varyant maskesi",
      output: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    tips: [
      "Neden v7 tercih edilmeli? Eski v4 rastgele olduğu için veritabanlarında indeks parçalanmasına yol açar. Yeni v7 standardı ise zamana göre sıralı olduğu için veritabanı performansını büyük oranda artırır.",
      "Rastgele bir v4 UUID'nin başka bir UUID ile çakışma ihtimali o kadar düşüktür ki, her saniye 1 milyar UUID üretilse bile ilk çakışma için yüzlerce yıl geçmesi gerekir."
    ]
  },

  numbase: {
    whatSimple: "Sayı Sistemleri aracı; bilgisayarların kullandığı 0 ve 1'lerden (ikili), günlük hayatta kullandığımız 10'lu sisteme ve renkler/hafıza adreslerinde kullanılan 16'lı (hex) sisteme kadar tüm sayı tabanları arasında çeviri yapar.",
    whatTechnical: "Konumsal sayı sistemleri (radix/base) dönüşüm modülü; BigInt aritmetiği kullanarak keyfi büyüklükteki sayıları 2 ile 36 tabanları arasında hassasiyet kaybı olmadan (overflow olmaksızın) dönüştürür. 0b, 0o ve 0x öneklerini destekler.",
    purpose: [
      "Bilgisayar mimarisi ve mikroişlemci derslerinde bit düzeyinde sayıları incelemek",
      "Bellek adreslerini ve makine kodlarını (Hexadecimal) ondalık sayılara çevirmek",
      "Ağ maskelerini ve IP adreslerini ikili (binary) bit dizileri halinde görselleştirmek",
      "Unicode karakter kodlarını ve ASCII değerlerini tespit etmek"
    ],
    how: [
      { title: "Girdi & Önek Ayıklama", desc: "Metin temizlenir, varsa 0x (hex), 0b (binary), 0o (octal) önekleri ayrıştırılır." },
      { title: "BigInt Taban Çözümlemesi", desc: "Her karakter taban değerine göre (0-9 ve A-Z) çözülerek 10'luk matematiksel değere toplanır." },
      { title: "Keyfi Hassasiyetli Bellek", desc: "JavaScript Number sınırını (2^53 - 1) aşan devasa sayılar BigInt ile güvenle saklanır." },
      { title: "Hedef Tabanlara Modülo Çevrimi", desc: "Sayı sırasıyla 2, 8, 10, 16 ve 36 tabanlarına bölünerek kalanlardan yeni basamaklar dizilir." },
      { title: "Bit Uzunluğu & Unicode Tespiti", desc: "Sayının kaç bit kapladığı ve geçerli bir Unicode karakteri olup olmadığı kontrol edilir." }
    ],
    example: {
      input: "255 (Onlu Taban)",
      process: "255 -> Taban 2, 8, 16 bölümleri",
      output: "İkili: 1111 1111 | Sekizli: 377 | Onaltılı: FF | Bit: 8"
    },
    tips: [
      "16'lık (Hex) sistem bilgisayar dünyasında çok sevilir; çünkü 1 Hex basamağı tam olarak 4 bite (yarım bayt / nibble), 2 Hex basamağı ise tam olarak 1 bayta (8 bit) denk gelir.",
      "Okumayı kolaylaştırmak için ikili sayılar bu araçta otomatik olarak 4'erli bit gruplarına (nibble) ayrılır."
    ]
  },

  textstats: {
    whatSimple: "Metin İstatistikleri; yazdığınız bir makalenin veya ödevin kelime, harf ve cümle sayısını hesaplayan, aynı zamanda bir insanın bu metni ortalama kaç dakikada okuyacağını ya da seslendireceğini ölçen bir analiz merkezidir.",
    whatTechnical: "Unicode duyarlı metin ayrıştırma (tokenization) motoru; Regex tabanlı kelime sınırları (\\p{L}\\p{N}), cümle terminatörleri, paragraf ayraçları ve UTF-8 bayt boyutu üzerinden istatistiksel ve frekans analizi üretir.",
    purpose: [
      "Ödev, makale, tez veya Twitter/sosyal medya karakter sınırlarını denetlemek",
      "Blog yazıları ve sunumlar için ortalama okuma ve konuşma süresini hesaplamak",
      "SEO içeriklerinde en sık tekrarlanan anahtar kelimeleri tespit etmek",
      "Metinlerin UTF-8 depolama boyutunu bayt seviyesinde görmek"
    ],
    how: [
      { title: "Unicode Karakter Dizisi", desc: "Array.from(text) ile emoji ve birleşik karakterler tek tek gerçek karakter olarak sayılır." },
      { title: "Kelime Ayrıştırma (Tokenization)", desc: "Unicode harf ve rakam paterni ile Türkçe noktalama işaretleri kelimelerden arındırılır." },
      { title: "Cümle & Paragraf Analizi", desc: "Nokta, ünlem, soru işareti ve satır boşluklarına göre cümle ve paragraf sınırları belirlenir." },
      { title: "Okuma & Konuşma Algoritması", desc: "Ortalama okuma hızı dakikada 200 kelime, konuşma hızı ise dakikada 130 kelime baz alınarak süre türetilir." },
      { title: "Frekans Analizi (En Sık Kelimeler)", desc: "3 harften uzun kelimeler küçük harfe çevrilerek frekans tablosu çıkarılır." }
    ],
    example: {
      input: "TeknoRadar Tools modern teknoloji araçları sunar.",
      process: "Kelime dizisi: 6 kelime | Karakter: 47 | Süre: 6/200 dk",
      output: "Karakter: 47 | Kelime: 6 | Okuma Süresi: < 1 dk"
    },
    tips: [
      "Emojiler normalde 1 harf gibi görünse de UTF-8 kodlamasında 4 bayta kadar yer kaplayabilir; bu araç karakter sayısını görsel olarak doğru hesaplar.",
      "Yazılarınızın akıcı olması için ortalama bir cümlenin 15-20 kelimeyi geçmemesine dikkat edebilirsiniz."
    ]
  },

  texttools: {
    whatSimple: "Metin İşlemleri; yazılarınızdaki tüm harfleri tek tıkla BÜYÜK veya küçük harfe çeviren, boşlukları temizleyen, satırları alfabetik sıraya dizen ve web linkleri (slug) üreten dijital bir metin atölyesidir.",
    whatTechnical: "Türkçe yerel dil desteği (toLocaleUpperCase/toLocaleLowerCase 'tr') ve Unicode normalizasyonu (NFD form) içeren metin manipülasyon ve filtreleme paketidir. Slug, URL encode/decode, satır numaralandırma ve tekilleştirme operasyonlarını yürütür.",
    purpose: [
      "Web siteleri ve bloglar için başlıkları URL dostu 'slug' formatına (ornek-yazi-basligi) dönüştürmek",
      "Büyük/küçük harf dönüşümünde Türkçe 'i/İ' ve 'ı/I' harf bozulmalarını önlemek",
      "Listelerdeki yinelenen (tekrar eden) satırları ve gereksiz boşlukları ayıklamak",
      "Satırları alfabetik (A-Z veya Z-A) sıralamak"
    ],
    how: [
      { title: "Metin Girdisi & Bellek", desc: "İşlenecek metin girdisi alınır ve seçilen işlem fonksiyonu belirlenir." },
      { title: "Türkçe Alfabe Kuralı", desc: "Standart JavaScript toUpperCase() fonksiyonu Türkçe 'i' harfini hatalı büyütebilir; bu araç 'tr-TR' yerelini zorunlu kılar." },
      { title: "Satır Bazlı İşlemler", desc: "Sıralama ve tekilleştirme işlemlerinde metin satır dizisine (\\n) bölünür, Set veri yapısıyla tekrar edenler silinir." },
      { title: "Slug & ASCII Temizliği", desc: "Türkçe özel karakterler (ç, ğ, ı, ö, ş, ü) ASCII eşdeğerlerine normalize edilir, aralara tire (-) konur." },
      { title: "Sonuç & Döngü", desc: "Üretilen çıktı tek tıkla kopyalanabilir veya bir sonraki işlem için anında girdiye taşınabilir." }
    ],
    example: {
      input: "TeknoRadar Tools: Harika Bir Proje!",
      process: "Slug işlemi -> Küçük harf, Türkçe karakter dönüştürme, tireleme",
      output: "teknoradar-tools-harika-bir-proje"
    },
    tips: [
      "Web adreslerinde (URL) Türkçe karakter (ş, ğ, ü vb.) ve boşluk kullanmak kırık linklere neden olur; başlıkları webde kullanmadan önce daima 'Slug' işleminden geçirin.",
      "'Sonucu girdiye taşı' butonunu kullanarak birden fazla metin işlemini art arda zincirleme şekilde uygulayabilirsiniz."
    ]
  },

  units: {
    whatSimple: "Birim Dönüştürücü; milimetreden kilometreye, gramdan tona, santigrat dereceden Fahrenheit'a kadar günlük hayatta ve bilimde karşılaştığınız tüm ölçü birimlerini anında birbirine çevirir.",
    whatTechnical: "Uluslararası Birimler Sistemi (SI) standartlarını temel alan boyutsal analiz motoru. Uzunluk, ağırlık, sıcaklık, hız, alan, hacim ve zaman kategorilerinde temel SI birimine (metre, kilogram, kelvin vb.) normalize edip hedef birim çarpanına bölerek tam dönüşüm sağlar.",
    purpose: [
      "Yabancı tariflerdeki sıcaklık (°F) veya ağırlık (oz/lb) ölçülerini Türkiye standartlarına (°C/kg) çevirmek",
      "Mühendislik, fizik veya matematik problemlerinde birim tutarlılığı sağlamak",
      "Araç hızlarını (km/s ve mph) veya deniz mili (knot) değerlerini karşılaştırmak",
      "Arsa ve emlak ölçümlerinde metrekare, dönüm ve hektar hesaplamaları yapmak"
    ],
    how: [
      { title: "Kategori & Birim Seçimi", desc: "Kullanıcının seçtiği fiziksel büyüklük (Uzunluk, Sıcaklık vb.) ve kaynak/hedef birimler alınır." },
      { title: "Sıcaklık Özel Fonksiyonu", desc: "Sıcaklık birimleri doğrusal çarpanla değil, ofsetli formülle (C = (F - 32) * 5/9) hesaplanır." },
      { title: "Temel SI Birimine Çevrim", desc: "Kaynak birim kendi katsayısıyla çarpılarak standart taban birime (örn. Metre) indirgenir." },
      { title: "Hedef Birime Dağıtım", desc: "Taban değer hedef birimin katsayısına bölünür." },
      { title: "Tüm Birimler Tablosu", desc: "Aynı anda o kategorideki tüm diğer birimlerin karşılığı tek listede hesaplanıp gösterilir." }
    ],
    example: {
      input: "100 km/h (Hız)",
      process: "100 / 3.6 = 27.777 m/s -> mph ve knot katsayıları",
      output: "27.78 m/s | 62.14 mph | 53.99 knot"
    },
    tips: [
      "Sıcaklık birimleri diğer birimler gibi '2 katına çıktı' şeklinde katlanamaz; çünkü 0 °C mutlak sıfır değildir (0 °C = 273.15 Kelvin).",
      "Listeden herhangi bir satıra dokunarak o birimdeki dönüştürülmüş sonucu doğrudan panoya kopyalayabilirsiniz."
    ]
  },

  cyber: {
    whatSimple: "Siber Koruma aracı; size gelen şüpheli SMS/e-postaları, tıkladığınız bağlantıları ve şifrelerinizin gücünü test eden, sizi internetteki dolandırıcılardan (oltalama/phishing) korumak için tasarlanmış kişisel bir güvenlik kalkanıdır.",
    whatTechnical: "İstemci tarafında çalışan kural tabanlı sezgisel (heuristic) tehdit analiz motoru, parola entropi denetleyicisi ve kriptografik rastgele parola üretecidir. Mesajlardaki sosyal mühendislik kalıplarını, URL yapılarındaki Punycode/IP/anormal port göstergelerini tarayıcı içinde yerel olarak analiz eder.",
    purpose: [
      "Gelen kargo, banka veya ödül mesajlarının dolandırıcılık (phishing) olup olmadığını sezgisel olarak test etmek",
      "Tıklanacak bağlantıların (URL) sahte domain veya IP adresi içerip içermediğini denetlemek",
      "Kullanılan şifrelerin kırılma zorluğunu ve güvenlik standartlarına uygunluğunu ölçmek",
      "Tahmin edilmesi imkansız, güçlü ve rastgele şifreler üretmek",
      "İnteraktif örneklerle gerçek oltalama tuzaklarını tanıma refleksini geliştirmek"
    ],
    how: [
      { title: "Sezgisel Mesaj Taraması", desc: "Aciliyet bildiren ('hemen', '24 saat'), şifre/kart isteyen veya ödül vadeden sosyal mühendislik ifadeleri ağırlıklı puanlanır." },
      { title: "URL Güvenlik Denetimleri", desc: "Protokol (HTTPS), domain yerine IP kullanımı, @ sembolüyle hedef şaşırtma, Punycode (xn--) taklitleri ve şüpheli portlar denetlenir." },
      { title: "Parola Entropi Kontrolü", desc: "Büyük/küçük harf, rakam, sembol, minimum uzunluk ve tekrarlanan/klavye dizisi kalıpları test edilir." },
      { title: "CSPRNG ile Güvenli Şifre Üretimi", desc: "crypto.getRandomValues() ile matematiksel olarak tahmin edilemez güçlü şifreler cihazda oluşturulur." },
      { title: "Tam Gizlilik", desc: "Girdiğiniz hiçbir mesaj, URL veya şifre hiçbir sunucuya iletilmez; analiz tamamen telefonunuzda/bilgisayarınızda biter." }
    ],
    example: {
      input: "Mesaj: 'Tebrikler! 5000 TL ödül kazandınız. Hemen onaylayın: odul-al.xyz'",
      process: "Puanlama: Ödül vaadi (+2) + Aciliyet (+2) + Şüpheli uzantı bağlantısı (+2)",
      output: "Risk Seviyesi: YÜKSEK RİSK (Sosyal mühendislik ve oltalama belirtileri)"
    },
    tips: [
      "Hiçbir banka, kargo şirketi veya devlet kurumu sizden SMS veya telefonla şifre, kart CVV kodu veya SMS doğrulama kodu istemez. Bu bilgileri asla kimseyle paylaşmayın.",
      "Şüpheli bir bağlantıya yanlışlıkla tıkladıysanız panik yapmayın: hiçbir bilgi girmeden ve dosya indirmeden sekmeyi hemen kapatın."
    ]
  }
};
