# STS Personnel Document System — MVP

Ücretsiz mimari:
- GitHub Pages: frontend
- Google Apps Script: backend/API
- Google Drive: personel klasörleri ve belgeler
- Google Sheets: personel, form tanımları ve loglar
- Google Docs: şablonlardan otomatik doküman üretimi

## Klasörler

- `frontend/` GitHub Pages'e yayınlanacak arayüz
- `apps-script/` Google Apps Script backend
- `docs/` kurulum ve veri modeli notları

## MVP'de bulunan akış

1. HR grup oluşturur.
2. HR form alanlarını oluşturur.
3. Belge alanları için zorunlu/opsiyonel, dosya türü, boyut, değiştirilebilirlik ve HR onayı tanımlanır.
4. HR grup için tokenlı başvuru linki oluşturur.
5. Personel link üzerinden formu doldurur.
6. Personel kaydı benzersiz `PER-YYYY-000001` ID alır.
7. Drive'da personel klasörü oluşturulur.
8. Belgeler standart isimle kaydedilir.
9. Sheets'e PERSONNEL ve DOCUMENT_LOG kayıtları düşer.
10. Tamamlanan kayıt için kişisel belge yönetim tokenı oluşturulur.
11. Personel daha sonra tekrar girip tek bir belgeyi değiştirebilir.
12. Eski sürüm ARCHIVE altında tutulur.
13. HR onayı gereken belgelerde değişiklik talebi oluşturulur.

## Güvenlik

- Gerçek kimlik/pasaport numaraları GitHub'a konmaz.
- Frontend'de gizli API anahtarı bulunmaz.
- Apps Script web app, Drive/Sheets erişimini backend üzerinden yapar.
- Üretimde HTTPS, token süreleri, rate limit ve erişim logları ayrıca kontrol edilmelidir.

## Önemli

Bu paket çalışan bir başlangıç/MVP iskeletidir. Google Drive/Sheets bağlantısı için `apps-script/Config.gs` içindeki ID'ler doldurulmalı ve Apps Script web uygulaması olarak deploy edilmelidir.
