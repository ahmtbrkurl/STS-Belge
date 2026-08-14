# Kurulum Sırası

## A. Google Drive

1. Google Drive'da `STS_PERSONNEL_DMS` klasörü oluştur.
2. Klasör ID'sini kopyala.
3. Google Sheet oluştur.
4. Sheet ID'sini kopyala.
5. İstersen Google Docs üzerinde personel şablonu oluştur ve ID'sini al.

## B. Google Sheet

`Config.gs` içindeki SHEETS isimleriyle aynı sayfalar oluşturulabilir. `ensureHeaders_()` ilk backend çalışmasında başlıkları oluşturur.

## C. Apps Script

1. script.google.com üzerinden yeni proje aç.
2. `apps-script/` altındaki `.gs` dosyalarını ekle.
3. `Config.gs` içindeki ID'leri doldur.
4. `ensureHeaders_()` fonksiyonunu bir kez çalıştırıp gerekli yetkileri ver.
5. Deploy > New deployment > Web app.
6. Execute as: sistemin Google hesabı.
7. Erişim politikasını şirket güvenlik gereksinimine göre seç.

## D. GitHub Pages

1. `frontend/` içeriğini GitHub repository'sine koy.
2. GitHub Pages'i etkinleştir.
3. `frontend/app.js` içindeki `API_URL` alanına Apps Script Web App URL'sini yaz.

## E. Üretime almadan önce

- Gerçek dosya upload endpointini multipart/base64 güvenli akışla tamamla.
- HR kimlik doğrulaması ekle.
- Token expiry ve revoke ekle.
- MIME/content validation ekle.
- Drive dosya paylaşımını kapalı tut.
- Hataları kullanıcıya ham stack trace olarak gösterme.
- KVKK saklama/silme politikası belirle.
