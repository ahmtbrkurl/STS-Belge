function rootFolder_(){
  return DriveApp.getFolderById(CONFIG.ROOT_DRIVE_FOLDER_ID);
}

function safe_(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase();
}

function createPersonFolder_(person){
  const year=new Date().getFullYear();
  const yearIt=rootFolder_().getFoldersByName(String(year));
  const yearFolder=yearIt.hasNext()?yearIt.next():rootFolder_().createFolder(String(year));
  const groupIt=yearFolder.getFoldersByName(person.groupId);
  const groupFolder=groupIt.hasNext()?groupIt.next():yearFolder.createFolder(person.groupId);
  const name=`${person.personId}_${safe_(person.firstName)}_${safe_(person.lastName)}_${String(person.nationalId).slice(-4)}`;
  const folder=groupFolder.createFolder(name);
  ['01_KIMLIK','02_PASAPORT','03_MESLEKI','04_FOTOGRAF','99_FORM','ARCHIVE'].forEach(n=>folder.createFolder(n));
  return folder;
}

function folderById_(id){ return DriveApp.getFolderById(id); }

function saveBlob_(folderId, blob, fileName){
  const folder=folderById_(folderId);
  const old=folder.getFilesByName(fileName);
  while(old.hasNext()) old.next().setTrashed(true);
  return folder.createFile(blob).setName(fileName);
}

function archiveExisting_(folderId, fileName){
  const folder=folderById_(folderId);
  const it=folder.getFilesByName(fileName);
  if(!it.hasNext()) return null;
  const file=it.next();
  const archiveIt=folder.getFoldersByName('ARCHIVE');
  const archive=archiveIt.hasNext()?archiveIt.next():folder.createFolder('ARCHIVE');
  const stamp=Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'yyyyMMdd_HHmmss');
  const archived=file.makeCopy(`${stamp}_${file.getName()}`,archive);
  file.setTrashed(true);
  return archived.getId();
}
