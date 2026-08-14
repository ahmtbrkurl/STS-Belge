# Teknik Mimari

## 1. Veri modeli

### GROUPS
- groupId
- name
- description
- active
- createdAt

### FORM_FIELDS
- fieldId
- groupId
- page
- sortOrder
- type
- code
- label
- required
- accept
- maxMB
- replaceAllowed
- hrApproval
- active

### PERSONNEL
- personId
- groupId
- formVersion
- firstName
- lastName
- nationalId
- passportNumber
- phone
- folderId
- status
- manageToken
- createdAt
- updatedAt

### DOCUMENTS
- personId
- documentCode
- fileId
- fileName
- version
- status
- updatedAt

### DOCUMENT_LOG
- timestamp
- personId
- groupId
- documentCode
- action
- version
- oldFileId
- newFileId
- actor
- note

### LINKS
- token
- groupId
- name
- expiresAt
- active
- createdAt

## 2. Belge değiştirme

Personel kişisel yönetim tokenı ile kayıt ekranına döner.

Normal belge:
- yeni dosya yüklenir
- eski aktif dosya ARCHIVE'e alınır
- yeni dosya aktif olur
- version +1
- DOCUMENT_LOG'a REPLACE yazılır

HR onaylı belge:
- yeni dosya doğrudan aktif edilmez
- değişiklik talebi açılır
- HR onayından sonra aktif edilir

## 3. Güvenlik

- Kimlik/pasaport numarasının tamamı yalnızca Google Sheets/Drive backendinde tutulur.
- GitHub'da PII bulunmaz.
- Browser hiçbir zaman DriveApp erişimine sahip olmaz.
- Dosya yükleme backend tarafından MIME type, boyut ve token doğrulamasıyla kabul edilmelidir.
- Manage token tahmin edilemez olmalıdır.
- Üretimde rate limiting ve audit log uygulanmalıdır.
